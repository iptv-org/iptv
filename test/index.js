const parsers = require('playlist-parser')
const M3U = parsers.M3U
const fs = require("fs")
const axios = require('axios')
const path = require('path')

const errorLog = 'error.log'
const timeout = 60000
const delay = 200

let tests = 0
let channels = 0
let failures = 0

const http = axios.create({ timeout })
http.defaults.headers.common["User-Agent"] = "VLC/2.2.4 LibVLC/2.2.4"

function writeToLog(test, country, msg, url) {
  var now = new Date()
  var line = `${test}(): ${country}: ${msg} '${url}'`
  fs.appendFileSync(path.resolve(__dirname) + '/../' + errorLog, now.toISOString() + ' ' + line + '\n')
  console.log(line)
}

function skipPlaylist(filename) {
	let test_country = process.env.TEST_COUNTRY
	if (test_country && filename !== 'channels/' + test_country + '.m3u') {
		return true;
	}
	return false;
}

function loadPlaylist(filename) {
  return M3U.parse(fs.readFileSync(path.resolve(__dirname) + "/../" + filename, { encoding: "utf8" }))
}

async function testAllLinksIsWorking() {

  tests++

  let countries = loadPlaylist('index.m3u')
  // countries = countries.slice(0, 2)

  for(let country of countries) {

    if (skipPlaylist(country.file)) {
	    continue;
    }

    const playlist = loadPlaylist(country.file)

    for(let channel of playlist) {

      await new Promise(resolve => {
        setTimeout(resolve, delay)
      })

      channels++

      try {

        await http.get(channel.file)

        continue

      } catch (err) {

        failures++

        writeToLog('testAllLinksIsWorking', country.file, err.message, channel.file)

      }

    }
  }

  if(failures === 0) {

    console.log(`OK (${tests} tests, ${channels} channels)`)
    
  } else {

    console.log(`FAILURES! (${tests} tests, ${channels} channels, ${failures} failures)`)

  }

}

console.log('Test is running...')

testAllLinksIsWorking()
