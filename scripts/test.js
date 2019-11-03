process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const helper = require('./helper')
const ffmpeg = require('fluent-ffmpeg')

const config = {
  debug: process.env.npm_config_debug || false,
  country: process.env.npm_config_country,
  exclude: process.env.npm_config_exclude,
  timeout: 10
}

let stats = {
  playlists: 0,
  channels: 0,
  failures: 0
}

async function test() {

  const playlist = helper.parsePlaylist('index.m3u')
  
  const countries = helper.filterPlaylists(playlist.items, config.country, config.exclude)

  for(let country of countries) {

    stats.playlists++

    console.log(`Processing '${country.url}'...`)

    const playlist = helper.parsePlaylist(country.url)

    for(let item of playlist.items) {

      stats.channels++

      if(config.debug) { console.log(`Checking '${item.url}'...`) }

      await new Promise(resolve => {
        
        const timeout = setTimeout(() => {

          resolve()
        
        }, config.timeout * 1000)

        ffmpeg(item.url, { timeout: 60 }).ffprobe((err) => {
      
          if(err) {
            const message = helper.parseMessage(err, item.url)

            stats.failures++

            helper.writeToLog(country.url, message, item.url)

            console.log(`${message} '${item.url}'`)
          }

          clearTimeout(timeout)

          resolve()

        })
      })

    }
  }

  if(stats.failures === 0) {

    console.log(`OK (${stats.playlists} playlists, ${stats.channels} channels)`)
    
  } else {

    console.log(`FAILURES! (${stats.playlists} playlists, ${stats.channels} channels, ${stats.failures} failures)`)

    process.exit(1)

  }

}

console.log('Test is running...')

test()
