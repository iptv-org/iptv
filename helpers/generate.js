const util = require('./util')
const ISO6391 = require('iso-639-1')

const debug = false
const types = ['full', 'country', 'content', 'language']
const categories = util.supportedCategories.map(c => c.toLowerCase())
let stats = {
  countries: 0,
  channels: 0
}

let languageBuffer = {
  undefined: []
}

let categoryBuffer = {}
categories.push('other')
categories.forEach(category => {
  categoryBuffer[category] = []
})

let repo = {
  categories: {},
  countries: {},
  languages: {}
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

      let category = channel.group.toLowerCase()
      if(categoryBuffer[category]) {
        categoryBuffer[category].push(channel)
      } else {
        categoryBuffer['other'].push(channel)
      }

      let languageCode = ISO6391.getCode(channel.language)
      if(languageCode) {
        if(!languageBuffer[languageCode]) {
          languageBuffer[languageCode] = []
        }

        languageBuffer[languageCode].push(channel)
      } else {
        languageBuffer['undefined'].push(channel)
      }

      let group = channel.group
      for(const type of types) {
        if(type === 'full') {
          channel.group = [ c.name, channel.group ].filter(i => i).join(';')
        } else if(type === 'country') {
          channel.group = c.name
        } else if(type === 'language') {
          channel.group = channel.language
        } else {
          channel.group = group
        }

        util.appendToFile(`index.${type}.m3u`, channel.toString())
      }

      stats.channels++
    }

    stats.countries++
  }

  for(const languageCode in languageBuffer) {
    let languageName = ISO6391.getName(languageCode)
    if(languageName) {
      repo.languages[languageCode] = { language: languageName, channels: 0, playlist: `<code>https://iptv-org.github.io/iptv/languages/${languageCode}.m3u</code>` }
    }
  }
  repo.languages['undefined'] = { language: 'Undefined', channels: 0, playlist: `<code>https://iptv-org.github.io/iptv/languages/undefined.m3u</code>` }

  util.clearCache()
  for(const languageCode in languageBuffer) {
    const filename = `languages/${languageCode}.m3u`
    util.createFile(filename, '#EXTM3U\n')
    
    let channels = util.sortByTitleAndUrl(languageBuffer[languageCode])
    for(const channel of channels) {
      if(!util.checkCache(channel.url)) {
        util.appendToFile(filename, channel.toString())
        util.addToCache(channel.url)
        repo.languages[languageCode].channels++
      }
    }
  }

  util.clearCache()
  for(const category in categoryBuffer) {
    let channels = util.sortByTitleAndUrl(categoryBuffer[category])
    for(const channel of channels) {
      if(!util.checkCache(channel.url)) {
        util.appendToFile(`categories/${category}.m3u`, channel.toString())
        util.addToCache(channel.url)
        repo.categories[category].channels++
      }
    }
  }

  const languages = Object.values(repo.languages)
  const lastRow = languages.splice(languages.length - 1, 1)[0]
  languages.sort((a, b) => {
    if(a.language < b.language) { return -1 }
    if(a.language > b.language) { return 1 }
    return 0
  })
  languages.push(lastRow)

  const languagesTable = util.generateTable(languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })
  util.createFile('./helpers/languages.md', languagesTable)

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
