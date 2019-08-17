const util = require('./util')

const debug = false
const verbose = false
const parseEpg = process.env.npm_config_epg || false

let stats = {
  total: 0,
  updated: 0,
  duplicates: 0,
  unvalid: 0
}
let buffer = {}

async function main() {

  console.log(`Parsing 'index.m3u'...`)
  const playlist = util.parsePlaylist('index.m3u')
  let countries = playlist.items
  if(debug) {
    console.log('Debug mode is turn on')
    countries = countries.slice(0, 1)
    // countries = [{ url: 'channels/ru.m3u' }, { url: 'channels/ua.m3u' }]
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
      let channel = util.createChannel({
        id: item.inf['tvg-id'],
        name: item.inf['tvg-name'],
        logo: item.inf['tvg-logo'],
        group: item.inf['group-title'],
        url: item.url,
        title: item.inf.title
      })

      if(util.checkCache(channel.url)) {
        stats.duplicates++
      } else if(!util.validateUrl(channel.url)) {
        stats.unvalid++
      } else {
        channels.push(channel)
        util.addToCache(channel.url)
      }
    }

    const epgUrl = playlist.attrs['x-tvg-url']
    if(epgUrl && !buffer[epgUrl] && parseEpg) {
      console.log(`Loading '${epgUrl}'...`)
      const epg = await util.loadEPG(epgUrl)
      console.log(`Adding '${epgUrl}' to buffer...`)
      buffer[epgUrl] = epg
    }

    if(buffer[epgUrl]) {
      console.log(`Fills in missing channel's data...`)
      for(let channel of channels) {
        let channelId = channel.id
        if(!channelId) continue
        let c = buffer[epgUrl].channels[channelId]
        if(!c) continue
        let updated = false
        
        if(!channel.name && c.names[0]) {
          channel.name = c.names[0]
          updated = true
          if(verbose) {
            console.log(`Added name '${c.names[0]}' to '${channel.id}'`)
          }
        }

        if(!channel.logo && c.icon) {
          const icon = c.icon.split('|')[0]
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
    channels = util.sortByTitle(channels)

    console.log(`Updating '${country.url}'...`)
    util.createFile(country.url, playlist.getHeader())
    channels.forEach(channel => {
      util.appendToFile(country.url, channel.toString())
    })

    stats.total += channels.length
  }

  console.log(`Total: ${stats.total}. Duplicates: ${stats.duplicates}. Unvalid: ${stats.unvalid}. Updated: ${stats.updated}.`)
}

main()