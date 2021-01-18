const { program } = require('commander')
const helper = require('./helper')
const axios = require('axios')
const ProgressBar = require('progress')
const instance = axios.create({ timeout: 1000, maxContentLength: 1000 })

program
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Debug mode')
  .option('-c, --country <country>', 'Comma-separated list of country codes')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded ')
  .option('--epg', 'Turn on EPG parser')
  .option('--resolution', 'Turn on resolution parser')
  .parse(process.argv)

const config = program.opts()

let globalBuffer = []
let bar

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
    await loadPlaylist('channels/unsorted.m3u')
      .then(removeUnsortedDuplicates)
      .then(updatePlaylist)
      .then(done)
  }

  finish()
}

function parseIndex() {
  console.info(`Parsing 'index.m3u'...`)
  const playlist = helper.parsePlaylist('index.m3u')
  playlist.items = helper
    .filterPlaylists(playlist.items, config.country, config.exclude)
    .filter(i => i.url !== 'channels/unsorted.m3u')
  console.info(`Found ${playlist.items.length} playlist(s)\n`)

  return playlist
}

async function loadPlaylist(url) {
  console.info(`Processing '${url}'...`)
  const playlist = helper.parsePlaylist(url)
  playlist.url = url
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
  console.info(`  Sorting channels...`)
  playlist.items = helper.sortBy(playlist.items, ['name', 'url'])

  return playlist
}

async function removeDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
  let buffer = {}
  const items = playlist.items.filter(i => {
    const result = typeof buffer[i.url] === 'undefined'
    if (result) {
      buffer[i.url] = true
    }

    return result
  })

  playlist.items = items

  return playlist
}

async function detectResolution(playlist) {
  if (!config.resolution) return playlist
  bar = new ProgressBar('  Detecting resolution: [:bar] :current/:total (:percent) ', {
    total: playlist.items.length
  })
  const results = []
  for (const item of playlist.items) {
    bar.tick()
    const url = item.url
    const response = await instance
      .get(url)
      .then(sleep(config.delay))
      .catch(err => {})
    if (isValid(response)) {
      const resolution = parseResolution(response.data)
      if (resolution) {
        item.resolution = resolution
      }
    }

    results.push(item)
  }

  playlist.items = results

  return playlist
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

async function updateFromEPG(playlist) {
  if (!config.epg) return playlist
  const tvgUrl = playlist.header.attrs['x-tvg-url']
  if (!tvgUrl) return playlist

  console.info(`  Adding data from '${tvgUrl}'...`)

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
        }
        if (!channel.language.length && epgItem.name.length && epgItem.name[0].lang) {
          channel.setLanguage(epgItem.name[0].lang)
        }
        if (!channel.logo && epgItem.icon.length) {
          channel.logo = epgItem.icon[0]
        }
      })

      return playlist
    })
    .catch(err => {
      console.log(`Error: EPG could not be loaded`)
    })
}

async function removeUnsortedDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
  const urls = globalBuffer.map(i => i.url)
  const items = playlist.items.filter(i => !urls.includes(i.url))
  if (items.length === playlist.items.length) return playlist
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
  const original = helper.readFile(playlist.url)
  let output = playlist.getHeader()
  for (let channel of playlist.items) {
    output += channel.toShortString()
  }

  if (original === output) {
    console.info(`No changes have been made.`)
    return false
  } else {
    helper.createFile(playlist.url, output)
    console.info(`Playlist has been updated.`)
  }

  return true
}

async function done() {
  console.info(` `)
}

function finish() {
  console.info('Done.')
}

main()
