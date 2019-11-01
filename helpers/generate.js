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
  }

  for(let country of countries) {
    console.log(`Parsing '${country.url}'...`)
    const playlist = util.parsePlaylist(country.url)

    const c = {
      name: country.name,
      code: util.getBasename(country.url).toUpperCase()
    }

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

  util.clearCache()
  for(const languageCode in languageBuffer) {
    const filename = `languages/${languageCode}.m3u`
    util.createFile(filename, '#EXTM3U\n')
    
    let channels = util.sortByTitleAndUrl(languageBuffer[languageCode])
    for(const channel of channels) {
      if(!util.checkCache(channel.url)) {
        util.appendToFile(filename, channel.toString())
        util.addToCache(channel.url)
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
      }
    }
  }
}

main()

console.log(`Countries: ${stats.countries}. Channels: ${stats.channels}.`)
