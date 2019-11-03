const helper = require('./helper')

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  epg: process.env.npm_config_epg || false
}

let playlists = {}
let isChanged = false

async function main() {
  console.log(`Parsing index...`)
  parseIndex()
  console.log(`Sorting channels...`)
  sortChannels()
  console.log(`Removing duplicates...`)
  removeDuplicates()

  if(config.epg) {
    console.log('Adding the missing data from EPG files...')
    await addMissingData()
  }

  if(isChanged) {
    console.log('Updating files...')
    updateFiles()
  } else {
    console.log('Nothing is changed.')
  }

  console.log('Done.\n')
}

function parseIndex() {
  const root = helper.parsePlaylist('index.m3u')
  const rootItems = helper.filterPlaylists(root.items, config.country, config.exclude)
  
  for(let rootItem of rootItems) {
    const playlist = helper.parsePlaylist(rootItem.url)
    const tvgUrl = playlist.header.attrs['x-tvg-url']

    playlists[rootItem.url] = playlist
    playlists[rootItem.url].items = playlist.items.map(item => {
      let channel = helper.createChannel(item)
      channel.epg = tvgUrl
      
      return channel
    })
  }
}

function sortChannels() {
  for(let pid in playlists) {
    const channels = playlists[pid].items
    playlists[pid].items = helper.sortBy(channels, ['title', 'url'])
    if(channels !== playlists[pid].items) { 
      playlists[pid].changed = true 
      isChanged = true
    }
  }
}

function removeDuplicates() {
  let buffer = {}
  for(let pid in playlists) {
    const channels = playlists[pid].items
    playlists[pid].items = channels.filter(i => {
      let result = typeof buffer[i.url] === 'undefined'
      
      if(result) {
        buffer[i.url] = true
      } else {
        if(config.debug) {
          console.log(`Duplicate of '${i.title}' has been removed from '${pid}'`)
        }
      }
      
      return result
    })

    if(channels.length !== playlists[pid].items.length) { 
      playlists[pid].changed = true 
      isChanged = true
    }
  }
}

function updateFiles() {
  for(let pid in playlists) {
    let playlist = playlists[pid]
    if(playlist.changed) {
      helper.createFile(pid, playlist.getHeader())
      for(let channel of playlist.items) {
        helper.appendToFile(pid, channel.toShortString())
      }

      if(config.debug) {
        console.log(`File '${pid}' has been updated`)
      }
    }
  }
}

async function addMissingData() {
  let guides = {}
  for(let playlist of Object.values(playlists)) {
    for(let item of playlist.items) {
      if(!item.epg) continue
      try {
        const guide = guides[item.epg] || await helper.parseEPG(item.epg)
        guides[item.epg] = guide

        if(!item.id) continue
        
        const channel = guide.channels[item.id]
        if(!channel) continue

        if(!item.name && channel.name.length) {
          item.name = channel.name[0].value
          if(config.debug) {
            console.log(`Added tvg-name '${item.name}' to '${item.id}'`)
          }
        }

        if(!item.language && channel.name.length && channel.name[0].lang) {
          item.language = channel.name[0].lang
          if(config.debug) {
            console.log(`Added tvg-language '${item.language}' to '${item.id}'`)
          }
        }

        if(!item.logo && channel.icon.length) {
          item.logo = channel.icon[0]
          if(config.debug) {
            console.log(`Added tvg-logo '${item.logo}' to '${item.id}'`)
          }
        }
      } catch(err) {
        console.error(`Could not load '${item.epg}'`)
        continue
      }
    }
  }
}

main()
