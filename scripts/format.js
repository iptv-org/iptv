const IPTVChecker = require('iptv-checker')
const normalize = require('normalize-url')
const { program } = require('commander')
const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const file = require('./helpers/file')
const log = require('./helpers/log')

const ignoreStatus = ['Geo-blocked', 'Not 24/7']

program
  .usage('[OPTIONS]...')
  .option('--debug', 'Enable debug mode')
  .option('-d, --delay <delay>', 'Set delay for each request', parseNumber, 0)
  .option('-t, --timeout <timeout>', 'Set timeout for each request', parseNumber, 5000)
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .parse(process.argv)

const config = program.opts()
const checker = new IPTVChecker({
  timeout: config.timeout
})

let buffer, origins
async function main() {
  log.start()

  let playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  playlists = utils.filterPlaylists(playlists, config.country, config.exclude)
  if (!playlists.length) log.print(`No playlist is selected\n`)
  for (const playlist of playlists) {
    await parser.parsePlaylist(playlist.url).then(updatePlaylist).then(savePlaylist)
  }

  log.finish()
}

function savePlaylist(playlist) {
  if (file.read(playlist.url) !== playlist.toString()) {
    log.print(`File '${playlist.url}' has been updated\n`)
    playlist.updated = true
  }

  playlist.save()
}

async function updatePlaylist(playlist) {
  const total = playlist.channels.length
  log.print(`Processing '${playlist.url}'...\n`)

  buffer = {}
  origins = {}
  for (const [i, channel] of playlist.channels.entries()) {
    const curr = i + 1
    updateDescription(channel, playlist)
    normalizeUrl(channel)

    if (ignoreStatus.includes(channel.status)) {
      continue
    }

    await checker
      .checkStream(channel.data)
      .then(parseResult)
      .then(result => {
        updateStatus(channel, result.status)
        if (result.status === 'online') {
          buffer[i] = result
          updateOrigins(channel, result.requests)
          updateResolution(channel, result.resolution)
        } else {
          buffer[i] = null
          if (config.debug) {
            log.print(`  INFO: ${channel.url} (${result.error})\n`)
          }
        }
      })
      .catch(err => {
        buffer[i] = null
        if (config.debug) {
          log.print(`  ERR: ${channel.data.url} (${err.message})\n`)
        }
      })
  }

  for (const [i, channel] of playlist.channels.entries()) {
    if (!buffer[i]) continue
    const { requests } = buffer[i]
    updateUrl(channel, requests)
  }

  return playlist
}

function updateOrigins(channel, requests) {
  if (!requests) return
  const origin = new URL(channel.url)
  const target = new URL(requests[0])
  const type = origin.host === target.host ? 'origin' : 'redirect'
  requests.forEach(url => {
    const key = utils.removeProtocol(url)
    if (!origins[key] && type === 'origin') {
      origins[key] = channel.url
    }
  })
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

function updateResolution(channel, resolution) {
  if (!channel.resolution.height && resolution) {
    channel.resolution = resolution
  }
}

function updateUrl(channel, requests) {
  for (const request of requests) {
    let key = utils.removeProtocol(channel.url)
    if (origins[key]) {
      channel.updateUrl(origins[key])
      break
    }

    key = utils.removeProtocol(request)
    if (origins[key]) {
      channel.updateUrl(origins[key])
      break
    }
  }
}

function parseResult(result) {
  return {
    status: parseStatus(result.status),
    resolution: result.status.ok ? parseResolution(result.status.metadata.streams) : null,
    requests: result.status.ok ? parseRequests(result.status.metadata.requests) : [],
    error: !result.status.ok ? result.status.reason : null
  }
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

function parseResolution(streams) {
  const resolution = streams
    .filter(stream => stream.codec_type === 'video')
    .reduce(
      (acc, curr) => {
        if (curr.height > acc.height) return { width: curr.width, height: curr.height }
        return acc
      },
      { width: 0, height: 0 }
    )

  return resolution.width > 0 && resolution.height > 0 ? resolution : null
}

function parseRequests(requests) {
  requests = requests.map(r => r.url)
  requests.shift()

  return requests
}

function updateDescription(channel, playlist) {
  const code = playlist.country.code
  // tvg-name
  if (!channel.tvg.name && channel.name) {
    channel.tvg.name = channel.name.replace(/\"/gi, '')
  }
  // tvg-id
  if (!channel.tvg.id && channel.tvg.name) {
    const id = utils.name2id(channel.tvg.name)
    channel.tvg.id = id ? `${id}.${code}` : ''
  }
  // country
  if (!channel.countries.length) {
    const name = utils.code2name(code)
    channel.countries = name ? [{ code, name }] : []
    channel.tvg.country = channel.countries.map(c => c.code.toUpperCase()).join(';')
  }
  // group-title
  channel.group.title = channel.category
}

function normalizeUrl(channel) {
  const normalized = normalize(channel.url, { stripWWW: false })
  const decoded = decodeURIComponent(normalized).replace(/\s/g, '+')
  channel.updateUrl(decoded)
}

function parseNumber(str) {
  return parseInt(str)
}

main()
