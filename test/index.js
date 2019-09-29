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
  }),
  validateStatus: function (status) {
    return status >= 200 && status < 400
  },
  headers: {
    'Accept': '*/*',
    'Accept-Language': 'en_US',
    'User-Agent': 'VLC/3.0.8 LibVLC/3.0.8',
    'Range': 'bytes=0-'
  },
  responseType: 'stream'
})

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

      await new Promise(resolve => {
        setTimeout(resolve, config.delay)
      })

      stats.channels++

      try {

        if(verbose) {
          console.log(`Checking '${item.url}'...`)
        }

        let response = await instance.get(item.url)

        response.data.destroy()

        continue

      } catch (err) {

        if(err.request && ['ECONNRESET'].indexOf(err.code) > -1) continue

        stats.failures++

        writeToLog(country.url, err.message, item.url)

      }

    }
  }

  if(stats.failures === 0) {

    console.log(`OK (${stats.tests} tests, ${stats.channels} channels)`)
    
  } else {

    console.log(`FAILURES! (${stats.tests} tests, ${stats.channels} channels, ${stats.failures} failures)`)

    process.exit(1)

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
