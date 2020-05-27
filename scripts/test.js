process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const helper = require('./helper')
const iptvChecker = require('iptv-checker-module')

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  timeout: 10000
}

let stats = {
  playlists: 0,
  channels: 0,
  failures: 0
}

async function test() {
  const playlist = helper.parsePlaylist('index.m3u')

  const countries = helper.filterPlaylists(playlist.items, config.country, config.exclude)

  for (let country of countries) {
    stats.playlists++

    console.log(`Processing '${country.url}'...`)

    const options = {
      timeout: config.timeout,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      debug: config.debug,
      omitMetadata: true,
      parallel: 1,
      itemCallback: item => {
        if (!item.status.ok && item.status.reason !== 'Timed out') {
          stats.failures++

          helper.writeToLog(country.url, item.status.reason, item.url)

          console.log(`${item.status.reason} '${item.url}'`)
        }
      }
    }

    await iptvChecker(country.url, options)
  }

  if (stats.failures === 0) {
    console.log(`OK (${stats.playlists} playlists, ${stats.channels} channels)`)
  } else {
    console.log(
      `FAILURES! (${stats.playlists} playlists, ${stats.channels} channels, ${stats.failures} failures)`
    )

    process.exit(1)
  }
}

console.log('Test is running...')

test()
