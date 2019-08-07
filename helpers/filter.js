const util = require('./util')

const debug = false
const blacklist = [
  '80.80.160.168', // repeats on a loop
  '63.237.48.3', // not a live stream
  '189.216.247.113', // not working streams
]
let stats = {
  channels: 0,
  removed: 0
}

function init() {

  console.log(`Parsing 'index.m3u'...`)
  const playlist = util.parsePlaylist('index.m3u')
  let countries = playlist.items
  if(debug) {
    console.log('Debug mode is turn on')
    countries = countries.slice(0, 1)
  }

  for(let country of countries) {
    console.log(`Parsing '${country.url}'...`)
    const playlist = util.parsePlaylist(country.url)

    if(debug) {
      console.log(`Creating channels list...`)
    }
    let channels = []
    for(let item of playlist.items) {

      const url = new URL(item.url)
      const host = url.hostname

      if(blacklist.indexOf(host) === -1) { 
        let channel = util.createChannel({
          id: item.inf['tvg-id'],
          name: item.inf['tvg-name'],
          logo: item.inf['tvg-logo'],
          group: item.inf['group-title'],
          url: item.url,
          title: item.inf.title
        })
        channels.push(channel)
      } else {
        stats.removed += 1
      }
    }

    console.log(`Updating '${country.url}'...`)
    util.createFile(country.url, playlist.getHeader())
    channels.forEach(channel => {
      util.appendToFile(country.url, channel.toString())
    })

    stats.channels += channels.length
  }
}

console.log('Starting...')

init()

console.log(`Total: ${stats.channels}. Removed: ${stats.removed}`)
