const IPTVChecker = require('iptv-checker')
const { program } = require('commander')
const ProgressBar = require('progress')
const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const log = require('./helpers/log')

program
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Enable debug mode')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--timeout <timeout>', 'Set timeout for each request', 5000)
  .parse(process.argv)

let bar
const config = program.opts()
const ignoreStatus = ['Geo-blocked', 'Not 24/7', 'Offline']
const checker = new IPTVChecker({
  timeout: config.timeout
})

async function main() {
  log.start()

  if (config.debug) log.print(`Debug mode enabled\n`)

  log.print(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = utils.filterPlaylists(playlists, config.country, config.exclude)
  for (const playlist of playlists) {
    await parser
      .parsePlaylist(playlist.url)
      .then(checkPlaylist)
      .then(p => p.save())
  }

  log.finish()
}

async function checkPlaylist(playlist) {
  bar = new ProgressBar(`Checking '${playlist.url}': [:bar] :current/:total (:percent) `, {
    total: playlist.channels.length
  })
  const channels = []
  const total = playlist.channels.length
  for (const [index, channel] of playlist.channels.entries()) {
    const skipChannel =
      channel.status &&
      ignoreStatus.map(i => i.toLowerCase()).includes(channel.status.toLowerCase())
    if (skipChannel) {
      channels.push(channel)
    } else {
      const result = await checker.checkStream(channel.data)
      if (
        result.status.ok ||
        result.status.reason.includes('timed out') ||
        result.status.reason.includes('access denied')
      ) {
        channels.push(channel)
      } else {
        if (config.debug) bar.interrupt(`ERR: ${channel.url}: ${result.status.reason}`)
      }
    }
    bar.tick()
  }

  if (playlist.channels.length !== channels.length) {
    log.print(`File '${playlist.url}' has been updated\n`)
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
