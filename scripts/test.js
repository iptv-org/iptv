const { program } = require('commander')
const helper = require('./helper')
const axios = require('axios')
const https = require('https')
const ProgressBar = require('progress')

program
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Debug mode')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .option('--delay <delay>', 'Delay between parser requests', 1000)
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

let stats = {
  playlists: 0,
  channels: 0,
  failures: 0
}

async function test() {
  const playlist = helper.parsePlaylist('index.m3u')

  const countries = helper.filterPlaylists(playlist.items, config.country, config.exclude)

  for (let country of countries) {
    const playlist = helper.parsePlaylist(country.url)
    const bar = new ProgressBar(`Processing '${country.url}'...:current/:total\n`, {
      total: playlist.items.length
    })

    stats.playlists++

    for (let channel of playlist.items) {
      bar.tick()
      stats.channels++
      await instance
        .get(channel.url)
        .then(helper.sleep(config.delay))
        .catch(error => {
          if (error.response) {
            stats.failures++
            helper.writeToLog(country.url, error.message, channel.url)
            console.log(`Error: ${error.message} '${channel.url}'`)
          }
        })
    }
  }

  if (stats.failures === 0) {
    console.log(`\nOK (${stats.playlists} playlists, ${stats.channels} channels)`)
  } else {
    console.log(
      `\nFAILURES! (${stats.playlists} playlists, ${stats.channels} channels, ${stats.failures} failures)`
    )

    process.exit(1)
  }
}

console.log('Test is running...\n')

test()
