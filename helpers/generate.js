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

let repo = {
  categories: {},
  countries: {}
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

  for(let category of categories) {
    const filename = `categories/${category}.m3u`
    console.log(`Creating '${filename}'...`)
    util.createFile(filename, '#EXTM3U\n')
    const categoryName = util.supportedCategories.find(c => c.toLowerCase() === category) || 'Other'
    repo.categories[category] = { category: categoryName, channels: 0, playlist: `<code>https://iptv-org.github.io/iptv/${filename}</code>` }
  }

  for(let country of countries) {
    console.log(`Parsing '${country.url}'...`)
    const playlist = util.parsePlaylist(country.url)

    const c = {
      name: country.name,
      code: util.getBasename(country.url).toUpperCase()
    }

    const epg = playlist.header.attrs['x-tvg-url'] ? `<code>${playlist.header.attrs['x-tvg-url']}</code>` : ''
    repo.countries[c.code] = { country: c.name, channels: playlist.items.length, playlist: `<code>https://iptv-org.github.io/iptv/${country.url}</code>`, epg }

    for(let item of playlist.items) {

      let channel = util.createChannel(item)

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
        repo.categories[category].channels++
      }
    }
  }

  const categoriesTable = util.generateTable(Object.values(repo.categories), {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })
  util.createFile('./helpers/categories.md', categoriesTable)
  const countriesTable = util.generateTable(Object.values(repo.countries), {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left' }
    ]
  })
  util.createFile('./helpers/countries.md', countriesTable)
}

main()

console.log(`Countries: ${stats.countries}. Channels: ${stats.channels}.`)
