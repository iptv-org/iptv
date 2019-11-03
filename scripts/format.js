const helper = require('./helper')

const config = {
  debug: false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  epg: process.env.npm_config_epg || false
}

// let stats = {
//   total: 0,
//   updated: 0,
//   duplicates: 0,
//   removed: 0
// }
// let buffer = {}

let playlists = {}

function parseIndex() {
  const root = helper.parsePlaylist('index.m3u')
  const rootItems = helper.filterPlaylists(root.items, config.country, config.exclude)
  
  for(let rootItem of rootItems) {
    const playlist = helper.parsePlaylist(rootItem.url)
    playlists[rootItem.url] = {}
    for(let item of playlist.items) {
      playlists[rootItem.url][item.url] = helper.createChannel(item)
    }
  }
}

function main() {
  console.log(`Parsing index...`)
  parseIndex()
  console.log(playlists)
  // add missing data from epg (if exists)
  // sort channels
  // save all playlists back
  // display stats

  // for(let country of countries) {

  //   if (helper.skipPlaylist(country.url)) {
  //     continue
  //   }
    
  //   if(verbose) {
  //     console.log(`Clear cache...`)
  //   }
  //   helper.clearCache()

  //   console.log(`Parsing '${country.url}'...`)
  //   const playlist = helper.parsePlaylist(country.url)

  //   if(verbose) {
  //     console.log(`Creating channels list...`)
  //   }
  //   let channels = []
  //   for(let item of playlist.items) {
  //     let channel = helper.createChannel(item)

  //     if(helper.checkCache(channel.url)) {
  //       stats.duplicates++
  //     } else if(!helper.validateUrl(channel.url)) {
  //       stats.unvalid++
  //     } else {
  //       channels.push(channel)
  //       helper.addToCache(channel.url)
  //     }

  //     if(unsorted[channel.url]) {
  //       if(verbose) {
  //         console.log(`Removed '${channel.url}' from 'channels/unsorted.m3u'...`)
  //       }
  //       delete unsorted[channel.url]
  //       stats.removed++
  //       stats.duplicates++
  //     }
  //   }

  //   const epgUrl = playlist.header.attrs['x-tvg-url']
  //   if(epgUrl && !buffer[epgUrl] && parseEpg) {
  //     try {
  //       console.log(`Loading '${epgUrl}'...`)
  //       const epg = await helper.loadEPG(epgUrl)
  //       console.log(`Adding '${epgUrl}' to buffer...`)
  //       buffer[epgUrl] = epg
  //     } catch(e) {
  //       console.log(`Could not load '${epgUrl}'`)
  //     }
  //   }

  //   if(buffer[epgUrl]) {
  //     console.log('Add missing tvg-id from EPG by channel title...')
  //     for(let channel of channels) {
  //       for(let channelId in buffer[epgUrl].channels) {
  //         let c = buffer[epgUrl].channels[channelId]
  //         for(let epgName of c.name) {
  //           if(epgName.value) {
  //             let escaped = helper.escapeStringRegexp(epgName.value)
  //             channelTitle = channel.title.replace(/(fhd|hd|sd|高清)$/i, '').trim()
  //             let regexp = new RegExp(`^${escaped}$`, 'i')
  //             if(regexp.test(channelTitle)) {
  //               if(!channel.id) {
  //                 channel.id = c.id
  //                 continue
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }

  //   if(buffer[epgUrl]) {
  //     console.log(`Fills in missing channel's data...`)
  //     for(let channel of channels) {
  //       let channelId = channel.id
  //       if(!channelId) continue
  //       let c = buffer[epgUrl].channels[channelId]
  //       if(!c) continue
  //       let updated = false
        
  //       if(!channel.name && c.name.length) {
  //         channel.name = c.name[0].value
  //         updated = true
  //         if(verbose) {
  //           console.log(`Added name '${c.name[0].value}' to '${channel.id}'`)
  //         }
  //       }

  //       if(!channel.language && c.name.length && c.name[0].lang) {
  //         let language = helper.getISO6391Name(c.name[0].lang)
  //         channel.language = language
  //         updated = true
  //         if(verbose) {
  //           console.log(`Added language '${language}' to '${channel.id}'`)
  //         }
  //       }

  //       if(!channel.logo && c.icon.length) {
  //         const icon = c.icon[0].split('|')[0]
  //         channel.logo = icon
  //         updated = true
  //         if(verbose) {
  //           console.log(`Added logo '${icon}' to '${channel.id}'`)
  //         }
  //       }

  //       if(updated) {
  //         stats.updated++
  //       }
  //     }
  //   }
    
  //   if(verbose) {
  //     console.log(`Sorting channels...`)
  //   }
  //   channels = helper.sortBy(channels, ['title', 'url'])

  //   if(!debug) {
  //     console.log(`Updating '${country.url}'...`)
  //     helper.createFile(country.url, playlist.getHeader())
  //     channels.forEach(channel => {
  //       helper.appendToFile(country.url, channel.toShortString())
  //     })
  //   }

  //   stats.total += channels.length
  // }

  // if(!debug & stats.removed > 0) {
  //   console.log(`Updating 'channels/unsorted.m3u'...`)
  //   helper.createFile('channels/unsorted.m3u', playlist.getHeader())
  //   Object.values(unsorted).forEach(channel => {
  //     helper.appendToFile('channels/unsorted.m3u', channel.toShortString())
  //   })
  // }

  // console.log(`Total: ${stats.total}. Duplicates: ${stats.duplicates}. Unvalid: ${stats.unvalid}. Updated: ${stats.updated}.`)
}

main()
