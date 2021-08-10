const { program } = require('commander')
const ProgressBar = require('progress')
const axios = require('axios')
const https = require('https')
const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const log = require('./helpers/log')

program
  .usage('[OPTIONS]...')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--delay <delay>', 'Delay between parser requests', 1000)
  .option('--timeout <timeout>', 'Set timeout for each request', 5000)
  .parse(process.argv)

const config = program.opts()
const ignoreStatus = ['Offline']
const instance = axios.create({
  timeout: config.timeout,
  maxContentLength: 200000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...\n`)
  let playlists = parser.parseIndex()
  playlists = utils
    .filterPlaylists(playlists, config.country, config.exclude)
    .filter(i => i.url !== 'channels/unsorted.m3u')

  for (const playlist of playlists) {
    await parser
      .parsePlaylist(playlist.url)
      .then(detectResolution)
      .then(p => p.save())
  }

  log.finish()
}

async function detectResolution(playlist) {
  const channels = []
  const bar = new ProgressBar(`Processing '${playlist.url}': [:bar] :current/:total (:percent) `, {
    total: playlist.channels.length
  })
  let updated = false
  for (const channel of playlist.channels) {
    bar.tick()
    const skipChannel =
      channel.status &&
      ignoreStatus.map(i => i.toLowerCase()).includes(channel.status.toLowerCase())
    if (!channel.resolution.height && !skipChannel) {
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
            updated = true
          }
        }
      }
    }

    channels.push(channel)
  }

  if (updated) {
    log.print(`File '${playlist.url}' has been updated\n`)
    playlist.channels = channels
    playlist.updated = true
  }

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

main()
