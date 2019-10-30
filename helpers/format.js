const util = require('./util')
const escapeStringRegexp = require('escape-string-regexp')
const ISO6391 = require('iso-639-1')

const debug = false
const verbose = false
const parseEpg = process.env.npm_config_epg || false

let stats = {
  total: 0,
  updated: 0,
  duplicates: 0,
  unvalid: 0,
  removed: 0
}
let buffer = {}
let unsorted = {}

async function main() {

  console.log(`Parsing 'index.m3u'...`)
  const playlist = util.parsePlaylist('index.m3u')
  const countries = playlist.items

  if(debug) {
    console.log('Debug mode is turn on')
  }

  const unsortedPlaylist = util.parsePlaylist('channels/unsorted.m3u')
  for(const item of unsortedPlaylist.items) {
    unsorted[item.url] = util.createChannel(item)
  }

  for(let country of countries) {

    if (util.skipPlaylist(country.url)) {
      continue
    }
    
    if(verbose) {
      console.log(`Clear cache...`)
    }
    util.clearCache()

    console.log(`Parsing '${country.url}'...`)
    const playlist = util.parsePlaylist(country.url)

    if(verbose) {
      console.log(`Creating channels list...`)
    }
    let channels = []
    for(let item of playlist.items) {
      let channel = util.createChannel(item)

      if(util.checkCache(channel.url)) {
        stats.duplicates++
      } else if(!util.validateUrl(channel.url)) {
        stats.unvalid++
      } else {
        channels.push(channel)
        util.addToCache(channel.url)
      }

      if(unsorted[channel.url]) {
        if(verbose) {
          console.log(`Removed '${channel.url}' from 'channels/unsorted.m3u'...`)
        }
        delete unsorted[channel.url]
        stats.removed++
        stats.duplicates++
      }
    }

    const epgUrl = playlist.header.attrs['x-tvg-url']
    if(epgUrl && !buffer[epgUrl] && parseEpg) {
      try {
        console.log(`Loading '${epgUrl}'...`)
        const epg = await util.loadEPG(epgUrl)
        console.log(`Adding '${epgUrl}' to buffer...`)
        buffer[epgUrl] = epg
      } catch(e) {
        console.log(`Could not load '${epgUrl}'`)
      }
    }

    if(buffer[epgUrl]) {
      console.log('Add missing tvg-id from EPG by channel title...')
      for(let channel of channels) {
        for(let channelId in buffer[epgUrl].channels) {
          let c = buffer[epgUrl].channels[channelId]
          for(let epgName of c.name) {
            if(epgName.value) {
              let escaped = escapeStringRegexp(epgName.value)
              channelTitle = channel.title.replace(/(fhd|hd|sd|高清)$/i, '').trim()
              let regexp = new RegExp(`^${escaped}$`, 'i')
              if(regexp.test(channelTitle)) {
                if(!channel.id) {
                  channel.id = c.id
                  continue
                }
              }
            }
          }
        }
      }
    }

    if(buffer[epgUrl]) {
      console.log(`Fills in missing channel's data...`)
      for(let channel of channels) {
        let channelId = channel.id
        if(!channelId) continue
        let c = buffer[epgUrl].channels[channelId]
        if(!c) continue
        let updated = false
        
        if(!channel.name && c.name.length) {
          channel.name = c.name[0].value
          updated = true
          if(verbose) {
            console.log(`Added name '${c.name[0].value}' to '${channel.id}'`)
          }
        }

        if(!channel.language && c.name.length && c.name[0].lang) {
          let language = ISO6391.getName(c.name[0].lang)
          channel.language = language
          updated = true
          if(verbose) {
            console.log(`Added language '${language}' to '${channel.id}'`)
          }
        }

        if(!channel.logo && c.icon.length) {
          const icon = c.icon[0].split('|')[0]
          channel.logo = icon
          updated = true
          if(verbose) {
            console.log(`Added logo '${icon}' to '${channel.id}'`)
          }
        }

        if(updated) {
          stats.updated++
        }
      }
    }
    
    if(verbose) {
      console.log(`Sorting channels...`)
    }
    channels = util.sortByTitleAndUrl(channels)

    if(!debug) {
      console.log(`Updating '${country.url}'...`)
      util.createFile(country.url, playlist.getHeader())
      channels.forEach(channel => {
        util.appendToFile(country.url, channel.toString())
      })
    }

    stats.total += channels.length
  }

  if(!debug & stats.removed > 0) {
    console.log(`Updating 'channels/unsorted.m3u'...`)
    util.createFile('channels/unsorted.m3u', playlist.getHeader())
    Object.values(unsorted).forEach(channel => {
      util.appendToFile('channels/unsorted.m3u', channel.toString())
    })
  }

  console.log(`Total: ${stats.total}. Duplicates: ${stats.duplicates}. Unvalid: ${stats.unvalid}. Updated: ${stats.updated}.`)
}

main()