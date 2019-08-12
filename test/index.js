const util = require('../helpers/util')
const axios = require('axios')
const https = require('https')

const verbose = process.env.npm_config_debug || false
const errorLog = 'error.log'
const config = {
  timeout: 60000,
  delay: 200
}

let stats = {
  tests: 0,
  channels: 0,
  failures: 0
}

const instance = axios.create({ 
  timeout: config.timeout,
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})
instance.defaults.headers.common["User-Agent"] = "VLC/2.2.4 LibVLC/2.2.4"

async function test() {

  stats.tests++

  const playlist = util.parsePlaylist('index.m3u')
  
  const countries = playlist.items

  for(let country of countries) {

    if (util.skipPlaylist(country.url)) {
	    continue
    }

    console.log(`Checking '${country.url}'...`)

    const playlist = util.parsePlaylist(country.url)

    for(let item of playlist.items) {

      if(item.url.indexOf('rtmp://') > -1) continue

      await new Promise(resolve => {
        setTimeout(resolve, config.delay)
      })

      stats.channels++

      try {

        if(verbose) {
          console.log(`Checking '${item.url}'...`)
        }

        await instance.get(item.url)

        continue

      } catch (err) {

        stats.failures++

        writeToLog(country.url, err.message, item.url)

      }

    }
  }

  if(stats.failures === 0) {

    console.log(`OK (${stats.tests} tests, ${stats.channels} channels)`)
    
  } else {

    console.log(`FAILURES! (${stats.tests} tests, ${stats.channels} channels, ${stats.failures} failures)`)

  }

}

console.log('Test is running...')

test()

function writeToLog(country, msg, url) {
  var now = new Date()
  var line = `${country}: ${msg} '${url}'`
  util.appendToFile(errorLog, now.toISOString() + ' ' + line + '\n')
  console.log(`Error: ${msg} '${url}'`)
}
