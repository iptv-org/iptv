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
  .option('-r --resolution', 'Parse stream resolution')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--delay <delay>', 'Delay between parser requests', 1000)
  .option('--timeout <timeout>', 'Set timeout for each request', 5000)
  .parse(process.argv)

const config = program.opts()

const instance = axios.create({
  timeout: config.timeout,
  maxContentLength: 200000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

async function main() {
  console.info('Starting...')
  console.time('Done in')

  const playlists = parseIndex()

  for (const playlist of playlists) {
    await loadPlaylist(playlist.url)
      .then(sortChannels)
      .then(filterChannels)
      .then(detectResolution)
      .then(savePlaylist)
      .then(done)
  }

  finish()
}

function parseIndex() {
  console.info(`\nParsing 'index.m3u'...`)
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

async function detectResolution(playlist) {
  if (!config.resolution) return playlist
  console.log('  Detecting resolution...')
  const bar = new ProgressBar('    Progress: [:bar] :current/:total (:percent) ', {
    total: playlist.channels.length
  })
  const results = []
  for (const channel of playlist.channels) {
    bar.tick()
    if (!channel.resolution.height) {
      const CancelToken = axios.CancelToken
      const source = CancelToken.source()
      const timeout = setTimeout(() => {
        source.cancel()
      }, config.timeout)

      const response = await instance
        .get(channel.url, { cancelToken: source.token })
        .then(res => {
          clearTimeout(timeout)

          return res
        })
        .then(utils.sleep(config.delay))
        .catch(err => {
          clearTimeout(timeout)
        })

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

async function savePlaylist(playlist) {
  const original = utils.readFile(playlist.url)
  const output = playlist.toString()

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
  console.timeEnd('Done in')
}

main()
