process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const util = require('../helpers/util')
const ffmpeg = require('fluent-ffmpeg')

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

      stats.channels++

      if(verbose) {
        console.log(`Checking '${item.url}'...`)
      }

      await new Promise(resolve => {
        ffmpeg(item.url, { timeout: config.timeout }).ffprobe((err) => {
      
          if(err) {
            const message = err.message.split('\n').find(line => {
              return /^\[[\w|\s|\d|@|\]]+/i.test(line)
            }).split(']')[1].trim()

            stats.failures++

            writeToLog(country.url, message, item.url)

          }

          resolve()

        })
      })

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
  console.log(`${msg} '${url}'`)
}
