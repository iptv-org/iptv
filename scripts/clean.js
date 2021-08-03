const { program } = require('commander')
const ProgressBar = require('progress')
const axios = require('axios')
const https = require('https')
const chalk = require('chalk')
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
const offlineStatusCodes = [404, 410, 451, 500, 501]
const ignore = ['Geo-blocked', 'Not 24/7']
const instance = axios.create({
  timeout: config.timeout,
  maxContentLength: 200000,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  }),
  validateStatus: function (status) {
    return !offlineStatusCodes.includes(status)
  }
})

let broken = 0

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = utils.filterPlaylists(playlists, config.country, config.exclude)
  for (const playlist of playlists) {
    await parser
      .parsePlaylist(playlist.url)
      .then(checkStatus)
      .then(p => p.save())
  }

  log.finish()
}

async function checkStatus(playlist) {
  let bar = new ProgressBar(`Checking '${playlist.url}': [:bar] :current/:total (:percent) `, {
    total: playlist.channels.length
  })
  const channels = []
  const total = playlist.channels.length
  for (const [index, channel] of playlist.channels.entries()) {
    const current = index + 1
    const counter = chalk.gray(`[${current}/${total}]`)
    bar.tick()
    if (
      (channel.status && ignore.map(i => i.toLowerCase()).includes(channel.status.toLowerCase())) ||
      (!channel.url.startsWith('http://') && !channel.url.startsWith('https://'))
    ) {
      channels.push(channel)
    } else {
      const CancelToken = axios.CancelToken
      const source = CancelToken.source()
      const timeout = setTimeout(() => {
        source.cancel()
      }, config.timeout)

      await instance
        .get(channel.url, { cancelToken: source.token })
        .then(() => {
          clearTimeout(timeout)
          channels.push(channel)
        })
        .then(utils.sleep(config.delay))
        .catch(err => {
          clearTimeout(timeout)
          if (err.response && offlineStatusCodes.includes(err.response.status)) {
            broken++
          } else {
            channels.push(channel)
          }
        })
    }
  }

  if (playlist.channels.length !== channels.length) {
    log.print(`File '${playlist.url}' has been updated\n`)
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
