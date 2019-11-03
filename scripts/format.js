const helper = require('./helper')

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  epg: process.env.npm_config_epg || false
}

let updated = 0

async function main() {
  console.log(`Parsing index...`)
  const index = parseIndex()

  for(let item of index.items) {
    console.log(`Processing '${item.url}'...`)
    let playlist = parsePlaylist(item.url)
    if(config.debug) { console.log(`Sorting channels...`) }
    playlist = sortChannels(playlist)
    if(config.debug) { console.log(`Removing duplicates...`) }
    playlist = removeDuplicates(playlist)
    
    if(config.epg) {
      const tvgUrl = playlist.header.attrs['x-tvg-url']
      if(tvgUrl) {
        if(config.debug) { console.log(`Loading EPG from '${tvgUrl}'...`) }
        const epg = await loadEPG(tvgUrl)
        if(config.debug) { console.log(`Adding the missing data from EPG...`) }
        playlist = addDataFromEPG(playlist, epg)
      } else {
        if(config.debug) { console.log(`EPG source is not found`) }
      }
    }

    if(playlist.changed) {
      updatePlaylist(item.url, playlist)
      updated++
    } else {
      console.log('Nothing is changed')
    }
  }

  console.log(`Updated ${updated} playlist(s)`)

  console.log('Done.\n')
}

function parseIndex() {
  const playlist = helper.parsePlaylist('index.m3u')
  playlist.items = helper.filterPlaylists(playlist.items, config.country, config.exclude)

  console.log(`Found ${playlist.items.length} playlist(s)`)

  return playlist
}

function parsePlaylist(url) {
  const playlist = helper.parsePlaylist(url)

  playlist.items = playlist.items.map(item => {
    return helper.createChannel(item)
  })

  return playlist
}

function sortChannels(playlist) {
  const channels = JSON.stringify(playlist.items)
  playlist.items = helper.sortBy(playlist.items, ['title', 'url'])
  if(channels !== JSON.stringify(playlist.items)) { playlist.changed = true }

  return playlist
}

function removeDuplicates(playlist) {
  let buffer = {}
  const channels = JSON.stringify(playlist.items)
  playlist.items = playlist.items.filter(i => {
    let result = typeof buffer[i.url] === 'undefined'
    
    if(result) {
      buffer[i.url] = true
    } else {
      if(config.debug) { console.log(`Duplicate of '${i.title}' has been removed`) }
    }
    
    return result
  })

  if(channels !== JSON.stringify(playlist.items)) { playlist.changed = true }

  return playlist
}

async function loadEPG(url) {
  try {
    return await helper.parseEPG(url)
  } catch(err) {
    console.error(`Error: could not load '${url}'`)
    return
  }
}

function addDataFromEPG(playlist, epg) {
  if(!epg) return playlist

  for(let item of playlist.items) {
    if(!item.id) continue
    
    const channel = epg.channels[item.id]

    if(!channel) continue

    if(!item.name && channel.name.length) {
      item.name = channel.name[0].value
      playlist.changed = true
      if(config.debug) { console.log(`Added tvg-name '${item.name}' to '${item.title}'`) }
    }

    if(!item.language && channel.name.length && channel.name[0].lang) {
      item.language = channel.name[0].lang
      playlist.changed = true
      if(config.debug) { console.log(`Added tvg-language '${item.language}' to '${item.title}'`) }
    }

    if(!item.logo && channel.icon.length) {
      item.logo = channel.icon[0]
      playlist.changed = true
      if(config.debug) { console.log(`Added tvg-logo '${item.logo}' to '${item.title}'`) }
    }
  }

  return playlist
}

function updatePlaylist(filepath, playlist) {
  helper.createFile(filepath, playlist.getHeader())
  for(let channel of playlist.items) {
    helper.appendToFile(filepath, channel.toShortString())
  }

  console.log(`Playlist '${filepath}' has been updated`)
}

main()
