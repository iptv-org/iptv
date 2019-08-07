const util = require('./util')

const debug = false
const types = ['full', 'country', 'content', 'sport']
let stats = {
  countries: 0,
  channels: 0,
  duplicates: 0
}

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

  for(let country of countries) {

    if(debug) {
      console.log(`Clear cache...`)
    }
    util.clearCache()

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

      if(util.checkCache(channel.url)) {
        
        stats.duplicates++
      
      } else {

        let category = channel.group

        for(const type of types) {
          if(type === 'full') {
            channel.group = [ c.name, channel.group ].filter(i => i).join(';')
          } else if(type === 'country') {
            channel.group = c.name
          } else {
            channel.group = category
          }

          const filename = `index.${type}.m3u`
          if(type === 'sport') {
            if(channel.group === 'Sport') {
              util.appendToFile(filename, channel.toString())
            }
          } else {
            util.appendToFile(filename, channel.toString())
          }
        }
        
        util.addToCache(channel.url)
      }

      stats.channels++
    }

    stats.countries++
  }
}

main()

console.log(`Countries: ${stats.countries}. Channels: ${stats.channels}. Unique: ${stats.channels - stats.duplicates}. Duplicates: ${stats.duplicates}.`)
