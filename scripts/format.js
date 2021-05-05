const { program } = require('commander')
const blacklist = require('./blacklist')
const parser = require('./parser')
const utils = require('./utils')
const axios = require('axios')
const ProgressBar = require('progress')
const https = require('https')

program
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Debug mode')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--delay <delay>', 'Delay between parser requests', 0)
  .option('--timeout <timeout>', 'Set timeout for each request', 5000)
  .parse(process.argv)

const config = program.opts()

const instance = axios.create({
  timeout: config.timeout,
  maxContentLength: 20000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

let globalBuffer = []

async function main() {
  const playlists = parseIndex()

  for (const playlist of playlists) {
    await loadPlaylist(playlist.url)
      .then(addToBuffer)
      .then(removeDuplicates)
      .then(sortChannels)
      .then(filterChannels)
      .then(detectResolution)
      .then(savePlaylist)
      .then(done)
  }

  if (playlists.length) {
    await loadPlaylist('channels/unsorted.m3u')
      .then(removeUnsortedDuplicates)
      .then(filterChannels)
      .then(sortChannels)
      .then(savePlaylist)
      .then(done)
  }

  finish()
}

function parseIndex() {
  console.info(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = utils
    .filterPlaylists(playlists, config.country, config.exclude)
    .filter(i => i.url !== 'channels/unsorted.m3u')
  console.info(`Found ${playlists.length} playlist(s)\n`)

  return playlists
}

async function loadPlaylist(url) {
  console.info(`Processing '${url}'...`)
  return parser.parsePlaylist(url)
}

async function addToBuffer(playlist) {
  if (playlist.url === 'channels/unsorted.m3u') return playlist
  globalBuffer = globalBuffer.concat(playlist.channels)

  return playlist
}

async function sortChannels(playlist) {
  console.info(`  Sorting channels...`)
  playlist.channels = utils.sortBy(playlist.channels, ['name', 'url'])

  return playlist
}

async function filterChannels(playlist) {
  console.info(`  Filtering channels...`)
  const list = blacklist.map(i => i.toLowerCase())
  playlist.channels = playlist.channels.filter(i => {
    return !list.includes(i.name.toLowerCase())
  })

  return playlist
}

async function removeDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
  let buffer = {}
  const channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) {
      buffer[url] = true
    }

    return result
  })

  playlist.channels = channels

  return playlist
}

async function detectResolution(playlist) {
  const bar = new ProgressBar('  Detecting resolution: [:bar] :current/:total (:percent) ', {
    total: playlist.channels.length
  })
  const results = []
  for (const channel of playlist.channels) {
    bar.tick()
    if (!channel.resolution.height) {
      const response = await instance
        .get(channel.url)
        .then(utils.sleep(config.delay))
        .catch(err => {})

      if (response && response.status === 200) {
        if (/^#EXTM3U/.test(response.data)) {
          const resolution = parseResolution(response.data)
          if (resolution) {
            channel.resolution = resolution
          }
        }
      }
    }

    results.push(channel)
  }

  playlist.channels = results

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

async function removeUnsortedDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
  // locally
  let buffer = {}
  let channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) buffer[url] = true

    return result
  })
  // globally
  const urls = globalBuffer.map(i => utils.removeProtocol(i.url))
  channels = channels.filter(i => !urls.includes(utils.removeProtocol(i.url)))
  if (channels.length === playlist.channels.length) return playlist

  playlist.channels = channels

  return playlist
}

async function savePlaylist(playlist) {
  const original = utils.readFile(playlist.url)
  const output = playlist.toString(true)

  if (original === output) {
    console.info(`No changes have been made.`)
    return false
  } else {
    utils.createFile(playlist.url, output)
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
