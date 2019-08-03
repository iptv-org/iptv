const util = require('./util')

const debug = false
const blacklist = [
  '80.80.160.168', // repeats on a loop
  '63.237.48.3', // not a live stream
  '189.216.247.113', // not working streams
]
let stats = {
  total: 0,
  removed: 0
}

function init() {

  let countries = util.parsePlaylist('index.m3u')

  if(debug) {
    countries = countries.slice(0, 2)
  }

  let channels = []

  for(let country of countries) {

    const playlist = util.parsePlaylist(country.file)

    for(let item of playlist) {

      const url = new URL(item.file)
      const host = url.hostname

      if(blacklist.indexOf(host) === -1) { 
        channels.push(item)
      } else {
        stats.removed += 1
      }
    }

    util.createFile(country.file, '#EXTM3U\n')

    channels.forEach(item => {
      const data = '#EXTINF:' + item.title + '\n' + item.file + '\n'

      util.writeToFile(country.file, data)
    })

    stats.total += channels.length

    channels = []
  }
}

init()

console.log(`Total: ${stats.total}. Removed: ${stats.removed}`)
