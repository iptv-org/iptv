const helper = require('./helper')

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  epg: process.env.npm_config_epg || false
}

let updated = 0
let items = []

async function main() {
  console.log(`Parsing index...`)
  const index = parseIndex()

  for (let item of index.items) {
    console.log(`Processing '${item.url}'...`)
    let playlist = parsePlaylist(item.url)
    items = items.concat(playlist.items)

    if (config.debug) {
      console.log(`Sorting channels...`)
    }
    playlist = sortChannels(playlist)

    if (config.debug) {
      console.log(`Removing duplicates...`)
    }
    playlist = removeDuplicates(playlist)

    if (config.epg) {
      const tvgUrl = playlist.header.attrs['x-tvg-url']
      if (tvgUrl) {
        if (config.debug) {
          console.log(`Loading EPG from '${tvgUrl}'...`)
        }
        const epg = await loadEPG(tvgUrl)
        if (config.debug) {
          console.log(`Adding the missing data from EPG...`)
        }
        playlist = addDataFromEPG(playlist, epg)
      } else {
        if (config.debug) {
          console.log(`EPG source is not found`)
        }
      }
    }

    updatePlaylist(item.url, playlist)
  }

  console.log(`Processing 'channels/unsorted.m3u'...`)
  filterUnsorted()

  console.log('Done.\n')
}

function parseIndex() {
  const playlist = helper.parsePlaylist('index.m3u')
  playlist.items = helper.filterPlaylists(playlist.items, config.country, config.exclude)

  console.log(`Found ${playlist.items.length + 1} playlist(s)`)

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
  playlist.items = helper.sortBy(playlist.items, ['name', 'url'])

  return playlist
}

function removeDuplicates(playlist) {
  let buffer = {}
  const channels = JSON.stringify(playlist.items)
  playlist.items = playlist.items.filter(i => {
    let result = typeof buffer[i.url] === 'undefined'

    if (result) {
      buffer[i.url] = true
    } else {
      if (config.debug) {
        console.log(`Duplicate of '${i.name}' has been removed`)
      }
    }

    return result
  })

  return playlist
}

async function loadEPG(url) {
  try {
    return await helper.parseEPG(url)
  } catch (err) {
    console.error(`Error: could not load '${url}'`)
    return
  }
}

function addDataFromEPG(playlist, epg) {
  if (!epg) return playlist

  for (let channel of playlist.items) {
    if (!channel.tvg.id) continue

    const epgItem = epg.channels[channel.tvg.id]

    if (!epgItem) continue

    if (!channel.tvg.name && epgItem.name.length) {
      channel.tvg.name = epgItem.name[0].value
      playlist.changed = true
      if (config.debug) {
        console.log(`Added tvg-name '${channel.tvg.name}' to '${channel.name}'`)
      }
    }

    if (!channel.language.length && epgItem.name.length && epgItem.name[0].lang) {
      channel.setLanguage(epgItem.name[0].lang)
      playlist.changed = true
      if (config.debug) {
        console.log(`Added tvg-language '${epgItem.name[0].lang}' to '${channel.name}'`)
      }
    }

    if (!channel.logo && epgItem.icon.length) {
      channel.logo = epgItem.icon[0]
      playlist.changed = true
      if (config.debug) {
        console.log(`Added tvg-logo '${channel.logo}' to '${channel.name}'`)
      }
    }
  }

  return playlist
}

function updatePlaylist(filepath, playlist) {
  helper.createFile(filepath, playlist.getHeader())
  for (let channel of playlist.items) {
    helper.appendToFile(filepath, channel.toShortString())
  }
}

function filterUnsorted() {
  const urls = items.map(i => i.url)
  const unsortedPlaylist = parsePlaylist('channels/unsorted.m3u')
  const before = unsortedPlaylist.items.length
  unsortedPlaylist.items = unsortedPlaylist.items.filter(i => !urls.includes(i.url))

  if (before !== unsortedPlaylist.items.length) {
    updatePlaylist('channels/unsorted.m3u', unsortedPlaylist)
    updated++
  }
}

main()
