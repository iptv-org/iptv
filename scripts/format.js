const helper = require('./helper')
const axios = require('axios')
const instance = axios.create({ timeout: 1000, maxContentLength: 1000 })

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  epg: process.env.npm_config_epg || false,
  resolution: process.env.npm_config_resolution || false
}

let globalBuffer = []

async function main() {
  const index = parseIndex()

  for (const item of index.items) {
    await loadPlaylist(item.url)
      .then(addToBuffer)
      .then(sortChannels)
      .then(removeDuplicates)
      .then(detectResolution)
      .then(updateFromEPG)
      .then(updatePlaylist)
      .then(done)
  }

  if (index.items.length) {
    await loadPlaylist('channels/unsorted.m3u').then(removeUnsortedDuplicates).then(updatePlaylist)
  }

  finish()
}

function parseIndex() {
  console.info(`Parsing 'index.m3u'...`)
  const playlist = helper.parsePlaylist('index.m3u')
  playlist.items = helper
    .filterPlaylists(playlist.items, config.country, config.exclude)
    .filter(i => i.url !== 'channels/unsorted.m3u')
  console.info(`Found ${playlist.items.length} playlist(s)`)
  console.info(`\n------------------------------------------\n`)

  return playlist
}

async function loadPlaylist(url) {
  console.info(`Processing '${url}'...`)
  const playlist = helper.parsePlaylist(url)
  playlist.url = url
  playlist.changed = false
  playlist.items = playlist.items
    .map(item => {
      return helper.createChannel(item)
    })
    .filter(i => i.url)

  return playlist
}

async function addToBuffer(playlist) {
  if (playlist.url === 'channels/unsorted.m3u') return playlist
  globalBuffer = globalBuffer.concat(playlist.items)

  return playlist
}

async function sortChannels(playlist) {
  if (config.debug) console.info(`  Sorting channels...`)
  playlist.items = helper.sortBy(playlist.items, ['name', 'url'])
  if (config.debug) console.info(`    Channels sorted by name.`)

  return playlist
}

async function removeDuplicates(playlist) {
  if (config.debug) console.info(`  Looking for duplicates...`)
  let buffer = {}
  const items = playlist.items.filter(i => {
    const result = typeof buffer[i.url] === 'undefined'
    if (result) {
      buffer[i.url] = true
    } else if (config.debug) {
      console.info(`    '${i.url}' removed`)
    }
    return result
  })

  if (config.debug && items.length === playlist.items.length) {
    console.info(`    No duplicates were found.`)
  }

  playlist.items = items

  return playlist
}

async function detectResolution(playlist) {
  if (!config.resolution) return playlist
  if (config.debug) console.info(`  Detecting resolution...`)
  const results = []
  for (const item of playlist.items) {
    const url = item.url
    if (config.debug) console.info(`    Fetching '${url}'...`)
    const response = await instance.get(url).catch(err => {})
    if (isValid(response)) {
      const resolution = parseResolution(response.data)
      if (resolution) {
        item.resolution = resolution
      }
      if (config.debug) console.info(`      Output: ${JSON.stringify(resolution)}`)
    } else {
      if (config.debug) console.error(`      Error: invalid response`)
    }

    results.push(item)
  }

  playlist.items = results

  return playlist
}

async function updateFromEPG(playlist) {
  if (!config.epg) return playlist
  const tvgUrl = playlist.header.attrs['x-tvg-url']
  if (!tvgUrl) return playlist
  if (config.debug) console.info(`  Loading EPG from '${tvgUrl}'...`)

  return helper
    .parseEPG(tvgUrl)
    .then(epg => {
      if (!epg) return playlist

      playlist.items.map(channel => {
        if (!channel.tvg.id) return channel
        const epgItem = epg.channels[channel.tvg.id]
        if (!epgItem) return channel
        if (!channel.tvg.name && epgItem.name.length) {
          channel.tvg.name = epgItem.name[0].value
          playlist.changed = true
          if (config.debug) {
            console.info(`    Added tvg-name '${channel.tvg.name}' to '${channel.name}'`)
          }
        }
        if (!channel.language.length && epgItem.name.length && epgItem.name[0].lang) {
          channel.setLanguage(epgItem.name[0].lang)
          playlist.changed = true
          if (config.debug) {
            console.info(`    Added tvg-language '${epgItem.name[0].lang}' to '${channel.name}'`)
          }
        }
        if (!channel.logo && epgItem.icon.length) {
          channel.logo = epgItem.icon[0]
          playlist.changed = true
          if (config.debug) {
            console.info(`    Added tvg-logo '${channel.logo}' to '${channel.name}'`)
          }
        }
      })

      return playlist
    })
    .catch(err => {
      if (config.debug) console.log(`    Error: EPG could not be loaded`)
    })
}

function parseResolution(string) {
  const regex = /RESOLUTION=(\d+)x(\d+)/gm
  const match = string.matchAll(regex)
  const arr = Array.from(match).map(m => ({
    width: parseInt(m[1]),
    height: parseInt(m[2])
  }))

  return arr.length
    ? arr.reduce(function (prev, current) {
        return prev.height > current.height ? prev : current
      })
    : undefined
}

async function removeUnsortedDuplicates(playlist) {
  if (config.debug) console.info(`  Looking for duplicates...`)
  const urls = globalBuffer.map(i => i.url)
  const items = playlist.items.filter(i => !urls.includes(i.url))
  if (items.length === playlist.items.length) {
    if (config.debug) console.info(`    No duplicates were found.`)
    return null
  }
  playlist.items = items

  return playlist
}

function sleep(ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

function isValid(response) {
  return response && response.status === 200 && /^#EXTM3U/.test(response.data)
}

async function updatePlaylist(playlist) {
  if (!playlist) {
    console.info(`No changes have been made.`)
    return false
  }
  helper.createFile(playlist.url, playlist.getHeader())
  for (let channel of playlist.items) {
    helper.appendToFile(playlist.url, channel.toShortString())
  }
  console.info(`File has been updated.`)

  return true
}

async function done() {
  if (config.debug) console.info(` `)
}

function finish() {
  console.info(`\n------------------------------------------\n`)
  console.info('Done.\n')
}

main()
