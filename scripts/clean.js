const { program } = require('commander')
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
  .option('--delay <delay>', 'Delay between parser requests', 1000)
  .option('--timeout <timeout>', 'Set timeout for each request', 3000)
  .parse(process.argv)

const config = program.opts()

const instance = axios.create({
  timeout: config.timeout,
  maxContentLength: 200000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  validateStatus: function (status) {
    return status !== 404
  }
})

const ignore = ['Geo-blocked', 'Not 24/7']

async function main() {
  const playlists = parseIndex()

  for (const playlist of playlists) {
    await loadPlaylist(playlist.url).then(checkStatus).then(savePlaylist).then(done)
  }

  finish()
}

function parseIndex() {
  console.info(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = utils.filterPlaylists(playlists, config.country, config.exclude)
  console.info(`Found ${playlists.length} playlist(s)\n`)

  return playlists
}

async function loadPlaylist(url) {
  console.info(`Processing '${url}'...`)
  return parser.parsePlaylist(url)
}

async function checkStatus(playlist) {
  const bar = new ProgressBar('  Testing: [:bar] :current/:total (:percent) ', {
    total: playlist.channels.length
  })
  const results = []
  for (const channel of playlist.channels) {
    bar.tick()
    if (
      (channel.status && ignore.map(i => i.toLowerCase()).includes(channel.status.toLowerCase())) ||
      (!channel.url.startsWith('http://') && !channel.url.startsWith('https://'))
    ) {
      results.push(channel)
    } else {
      await instance
        .get(channel.url)
        .then(() => {
          results.push(channel)
        })
        .then(utils.sleep(config.delay))
        .catch(err => {
          if (err.response && err.response.status === 404) {
            //console.error(err)
          } else {
            results.push(channel)
          }
        })
    }
  }

  playlist.channels = results

  return playlist
}

async function savePlaylist(playlist) {
  const original = utils.readFile(playlist.url)
  const output = playlist.toString({ raw: true })

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
