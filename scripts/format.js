const IPTVChecker = require('iptv-checker')
const { program } = require('commander')
const ProgressBar = require('progress')
const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const file = require('./helpers/file')
const log = require('./helpers/log')

program
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Enable debug mode')
  .option('-s, --status', 'Update stream status')
  .option('-r, --resolution', 'Detect stream resolution')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--timeout <timeout>', 'Set timeout for each request', 5000)
  .parse(process.argv)

let bar
const ignoreStatus = ['Geo-blocked', 'Not 24/7']
const config = program.opts()
const checker = new IPTVChecker({
  timeout: config.timeout
})

async function main() {
  log.start()

  if (config.debug) log.print(`Debug mode enabled\n`)
  if (config.status) log.print(`Status check enabled\n`)
  if (config.resolution) log.print(`Resolution detection enabled\n`)

  let playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  playlists = utils.filterPlaylists(playlists, config.country, config.exclude)
  if (!playlists.length) log.print(`No playlist is selected\n`)
  for (const playlist of playlists) {
    await parser
      .parsePlaylist(playlist.url)
      .then(updatePlaylist)
      .then(playlist => {
        if (file.read(playlist.url) !== playlist.toString()) {
          log.print(`File '${playlist.url}' has been updated\n`)
          playlist.updated = true
        }

        playlist.save()
      })
  }

  log.finish()
}

async function updatePlaylist(playlist) {
  if (!config.debug) {
    bar = new ProgressBar(`Processing '${playlist.url}': [:bar] :current/:total (:percent) `, {
      total: playlist.channels.length
    })
  } else {
    log.print(`Processing '${playlist.url}'...\n`)
  }

  for (const channel of playlist.channels) {
    addMissingData(channel)
    const checkOnline = config.status || config.resolution
    const skipChannel =
      channel.status &&
      ignoreStatus.map(i => i.toLowerCase()).includes(channel.status.toLowerCase())
    if (checkOnline && !skipChannel) {
      await checker
        .checkStream(channel.data)
        .then(result => {
          const status = parseStatus(result.status)

          if (config.status) {
            updateStatus(channel, status)
          }

          if (config.resolution && status === 'online') {
            updateResolution(channel, result.status.metadata)
          }

          if (config.debug && status === 'offline') {
            log.print(`  ERR: ${channel.url} (${result.status.reason})\n`)
          }
        })
        .catch(err => {
          if (config.debug) log.print(`  ERR: ${channel.url} (${err.message})\n`)
        })
    }
    if (!config.debug) bar.tick()
  }

  return playlist
}

function parseStatus(status) {
  if (status.ok) {
    return 'online'
  } else if (status.reason.includes('timed out')) {
    return 'timeout'
  } else if (status.reason.includes('403')) {
    return 'error_403'
  } else if (status.reason.includes('not one of 40{0,1,3,4}')) {
    return 'error_40x' // 402, 451
  } else {
    return 'offline'
  }
}

function updateStatus(channel, status) {
  switch (status) {
    case 'online':
      channel.status = null
      break
    case 'offline':
      channel.status = 'Offline'
      break
  }
}

function addMissingData(channel) {
  // add tvg-name
  if (!channel.tvg.name && channel.name) {
    channel.tvg.name = channel.name.replace(/\"/gi, '')
  }
  // add tvg-id
  if (!channel.tvg.id && channel.tvg.name) {
    const id = utils.name2id(channel.tvg.name)
    channel.tvg.id = id ? `${id}.${code}` : ''
  }
  // add country
  if (!channel.countries.length) {
    const name = utils.code2name(code)
    channel.countries = name ? [{ code, name }] : []
    channel.tvg.country = channel.countries.map(c => c.code.toUpperCase()).join(';')
  }
  // update group-title
  channel.group.title = channel.category
}

function updateResolution(channel, metadata) {
  const streams = metadata ? metadata.streams.filter(stream => stream.codec_type === 'video') : []
  if (!channel.resolution.height && streams.length) {
    channel.resolution = streams.reduce((acc, curr) => {
      if (curr.height > acc.height) return { width: curr.width, height: curr.height }
      return acc
    })
  }
}

main()
