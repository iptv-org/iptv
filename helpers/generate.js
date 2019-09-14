const util = require('./util')

const debug = false
const types = ['full', 'country', 'content']
const categories = util.supportedCategories.map(c => c.toLowerCase())
let stats = {
  countries: 0,
  channels: 0
}

let buffer = {}
categories.push('other')
categories.forEach(category => {
  buffer[category] = []
})

function main() {
  console.log(`Parsing 'index.m3u'...`)
  const playlist = util.parsePlaylist('index.m3u')
  let countries = playlist.items
  if(debug) {
    console.log('Debug mode is turn on')
    countries = countries.slice(0, 1)
  }

  for(let type of types) {
    const filename = `index.${type}.m3u`
    console.log(`Creating '${filename}'...`)
    util.createFile(filename, '#EXTM3U\n')
  }

  for(let category of categories) {
    const filename = `categories/${category}.m3u`
    console.log(`Creating '${filename}'...`)
    util.createFile(filename, '#EXTM3U\n')
  }

  for(let country of countries) {
    console.log(`Parsing '${country.url}'...`)
    const playlist = util.parsePlaylist(country.url)

    const c = {
      name: country.inf.title,
      code: util.getBasename(country.url).toUpperCase()
    }

    for(let item of playlist.items) {

      let channel = util.createChannel({
        id: item.inf['tvg-id'],
        name: item.inf['tvg-name'],
        logo: item.inf['tvg-logo'],
        group: item.inf['group-title'],
        url: item.url,
        title: item.inf.title
      })

      let group = channel.group

      for(const type of types) {
        if(type === 'full') {
          channel.group = [ c.name, channel.group ].filter(i => i).join(';')
        } else if(type === 'country') {
          channel.group = c.name
        } else {
          channel.group = group
        }

        util.appendToFile(`index.${type}.m3u`, channel.toString())
      }

      let category = channel.group.toLowerCase()
      if(buffer[category]) {
        buffer[category].push(channel)
      } else {
        buffer['other'].push(channel)
      }

      stats.channels++
    }

    stats.countries++
  }

  for(const category in buffer) {
    let channels = util.sortByTitleAndUrl(buffer[category])
    for(const channel of channels) {
      if(!util.checkCache(channel.url)) {
        util.appendToFile(`categories/${category}.m3u`, channel.toString())
        util.addToCache(channel.url)
      }
    }
  }
}

main()

console.log(`Countries: ${stats.countries}. Channels: ${stats.channels}.`)
