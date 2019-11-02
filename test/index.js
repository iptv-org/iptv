process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

const helper = require('../scripts/helper')
const ffmpeg = require('fluent-ffmpeg')

const verbose = process.env.npm_config_debug || false
const errorLog = 'error.log'
const config = {
  timeout: 10
}

let stats = {
  tests: 0,
  channels: 0,
  failures: 0
}

async function test() {

  stats.tests++

  const playlist = helper.parsePlaylist('index.m3u')
  
  const countries = playlist.items

  for(let country of countries) {

    if (helper.skipPlaylist(country.url)) {
	    continue
    }

    console.log(`Checking '${country.url}'...`)

    const playlist = helper.parsePlaylist(country.url)

    for(let item of playlist.items) {

      stats.channels++

      if(verbose) {
        console.log(`Checking '${item.url}'...`)
      }

      await new Promise(resolve => {
        
        const timeout = setTimeout(() => {

          resolve()
        
        }, config.timeout * 1000)

        ffmpeg(item.url, { timeout: 60 }).ffprobe((err) => {
      
          if(err) {
            const message = parseMessage(err, item.url)

            stats.failures++

            writeToLog(country.url, message, item.url)
          }

          clearTimeout(timeout)

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
  helper.appendToFile(errorLog, now.toISOString() + ' ' + line + '\n')
  console.log(`${msg} '${url}'`)
}

function parseMessage(err, u) {
  if(!err || !err.message) return

  const msgArr = err.message.split('\n')

  if(msgArr.length === 0) return

  const line = msgArr.find(line => {
    return line.indexOf(u) === 0
  })

  if(!line) return

  return line.replace(`${u}: `, '')
}
