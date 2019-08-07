const util = require('./util')

const debug = true
const verbal = false
let stats = {
  countries: 0,
  channels: 0,
  updated: 0
}
let buffer = {}

async function main() {
  console.log('Parsing index.m3u...')
  const playlist = util.parsePlaylist('index.m3u')
  let countries = playlist.items
  if(debug) {
    console.log('Debug mode is turn on')
    // countries = countries.slice(0, 1)
    // countries = [{ url: 'channels/au.m3u' }]
  }

  for(let country of countries) {
    console.log(`Parsing ${country.url}...`)
    const playlist = util.parsePlaylist(country.url)

    console.log(`Creating channels list...`)
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
      channels.push(channel)
    }

    const epgUrl = playlist.attrs['x-tvg-url']
    if(epgUrl && !buffer[epgUrl]) {
      console.log(`Loading ${epgUrl}...`)
      const epg = await util.loadEPG(epgUrl)
      console.log(`Adding ${epgUrl} to buffer...`)
      buffer[epgUrl] = epg
    }

    console.log(`Fills in missing channel's data...`)
    for(let channel of channels) {
      let channelId = channel.id
      if(!channelId) continue
      let c = buffer[epgUrl] ? buffer[epgUrl].channels[channelId] : null
      if(!c) continue
      let updated = false
      
      if(!channel.name && c.names[0]) {
        channel.name = c.names[0]
        updated = true
        if(verbal) {
          console.log(`Added name '${c.names[0]}' to '${channel.id}'`)
        }
      }

      if(!channel.logo && c.icon) {
        channel.logo = c.icon
        updated = true
        if(verbal) {
          console.log(`Added logo '${c.icon}' to '${channel.id}'`)
        }
      }

      if(updated) {
        stats.updated++
      }
    }
    
    console.log(`Sorting channels...`)
    channels = util.sortByTitle(channels)

    console.log(`Writing result to file...`)
    util.createFile(country.url, playlist.getHeader())
    channels.forEach(channel => {
      util.appendToFile(country.url, channel.toString())
    })

    stats.countries++
    stats.channels += channels.length
  }

  console.log(`Countries: ${stats.countries}. Channels: ${stats.channels}. Updated: ${stats.updated}.`)
}

main()