const util = require('../helpers/util')
const axios = require('axios')
const path = require('path')

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

const http = axios.create({ timeout: config.timeout })
http.defaults.headers.common["User-Agent"] = "VLC/2.2.4 LibVLC/2.2.4"

function writeToLog(test, country, msg, url) {
  var now = new Date()
  var line = `${test}(): ${country}: ${msg} '${url}'`
  util.writeToFile(errorLog, now.toISOString() + ' ' + line + '\n')
  console.log(line)
}

function skipPlaylist(filename) {
	let test_country = process.env.npm_config_country
	if (test_country && filename !== 'channels/' + test_country + '.m3u') {
		return true;
	}
	return false;
}

async function test() {

  stats.tests++

  let countries = util.parsePlaylist('index.m3u')

  for(let country of countries) {

    if (skipPlaylist(country.file)) {
	    continue;
    }

    const playlist = util.parsePlaylist(country.file)

    for(let channel of playlist) {

      await new Promise(resolve => {
        setTimeout(resolve, config.delay)
      })

      stats.channels++

      try {

        await http.get(channel.file)

        continue

      } catch (err) {

        stats.failures++

        writeToLog('test', country.file, err.message, channel.file)

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
