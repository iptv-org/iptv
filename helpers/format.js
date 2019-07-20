const util = require('./util')

const debug = false
let total = 0

function init() {

  let countries = util.parsePlaylist('index.m3u')

  if(debug) {
    countries = countries.slice(0, 2)
  }

  let channels = []

  for(let country of countries) {

    const playlist = util.parsePlaylist(country.file)

    for(let item of playlist) {

      let channel = util.parseChannelData(item)

      channels.push(channel)

    }

    channels = util.sortByTitle(channels)

    util.createFile(country.file, '#EXTM3U\n')

    channels.forEach(channel => {
      const info = `-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.title}`

      const data = '#EXTINF:' + info + '\n' + channel.file + '\n'

      util.writeToFile(country.file, data)
    })

    total += channels.length

    channels = []
  }
}

init()

console.log(`Total: ${total}.`)
