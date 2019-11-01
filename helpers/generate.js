const util = require('./util')
const ISO6391 = require('iso-639-1')

let list = {
  all: [],
  countries: {},
  languages: {},
  categories: {}
}

function parseIndex() {
  const root = util.parsePlaylist('index.m3u')

  let countries = {}
  let languages = {}
  let categories = {}

  for(let rootItem of root.items) {
    const playlist = util.parsePlaylist(rootItem.url)
    const countryCode = util.getBasename(rootItem.url).toLowerCase()
    const countryName = rootItem.name

    for(let item of playlist.items) {
      const channel = util.createChannel(item)
      channel.countryCode = countryCode
      channel.countryName = countryName

      // all
      list.all.push(channel)

      // country
      if(!countries[countryCode]) {
        countries[countryCode] = []
      }
      countries[countryCode].push(channel)

      // language
      const languageCode = ISO6391.getCode(channel.language) || 'undefined'
      if(!languages[languageCode]) {
        languages[languageCode] = []
      }
      languages[languageCode].push(channel)

      // category
      const categoryCode = channel.group.toLowerCase() || 'other'
      if(!categories[categoryCode]) {
        categories[categoryCode] = []
      }
      categories[categoryCode].push(channel)
    }
  }

  list.countries = countries
  list.languages = languages
  list.categories = categories
}

function generateCountryIndex() {
  const filename = `index.country.m3u`
  util.createFile(filename, '#EXTM3U\n')

  for(let channel of list.all) {
    const group = channel.group
    channel.group = channel.countryName
    util.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateLanguageIndex() {
  const filename = `index.language.m3u`
  util.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.language < b.language) { return -1 }
    if(a.language > b.language) { return 1 }
    return 0
  })

  for(let channel of channels) {
    const group = channel.group
    channel.group = channel.language
    util.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateContentIndex() {
  const filename = `index.content.m3u`
  util.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.group < b.group) { return -1 }
    if(a.group > b.group) { return 1 }
    return 0
  })

  for(let channel of channels) {
    util.appendToFile(filename, channel.toString())
  }
}

function generateFullIndex() {
  const filename = `index.full.m3u`
  util.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.countryName < b.countryName) { return -1 }
    if(a.countryName > b.countryName) { return 1 }
    if(a.group < b.group) { return -1 }
    if(a.group > b.group) { return 1 }
    return 0
  })

  for(let channel of channels) {
    const group = channel.group
    channel.group = [ channel.countryName, channel.group ].filter(i => i).join(';')
    util.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function main() {
  console.log(`Parsing index...`)
  parseIndex()
  console.log('Generating index.country.m3u...')
  generateCountryIndex()
  console.log('Generating index.language.m3u...')
  generateLanguageIndex()
  console.log('Generating index.content.m3u...')
  generateContentIndex()
  console.log('Generating index.full.m3u...')
  generateFullIndex()
  // console.log(output)

  // let group = channel.group
      // for(const type of types) {
      //   if(type === 'full') {
      //     channel.group = [ c.name, channel.group ].filter(i => i).join(';')
      //   } else if(type === 'country') {
      //     channel.group = c.name
      //   } else if(type === 'language') {
      //     channel.group = channel.language
      //   } else {
      //     channel.group = group
      //   }

      //   util.appendToFile(`index.${type}.m3u`, channel.toString())
      // }


  // for(let type of types) {
  //   const filename = `index.${type}.m3u`
  //   console.log(`Creating '${filename}'...`)
  //   util.createFile(filename, '#EXTM3U\n')
  // }

  // const categories = util.supportedCategories
  // for(let category of categories) {
  //   const categoryCode = category.toLowerCase()
  //   util.createFile(`categories/${categoryCode}.m3u`, '#EXTM3U\n')
  // }

  // util.clearCache()
  // for(const languageCode in languageBuffer) {
  //   const filename = `languages/${languageCode}.m3u`
  //   util.createFile(filename, '#EXTM3U\n')
    
  //   let channels = util.sortByTitleAndUrl(languageBuffer[languageCode])
  //   for(const channel of channels) {
  //     if(!util.checkCache(channel.url)) {
  //       util.appendToFile(filename, channel.toString())
  //       util.addToCache(channel.url)
  //     }
  //   }
  // }

  // util.clearCache()
  // for(const category in categoryBuffer) {
  //   let channels = util.sortByTitleAndUrl(categoryBuffer[category])
  //   for(const channel of channels) {
  //     if(!util.checkCache(channel.url)) {
  //       util.appendToFile(`categories/${category}.m3u`, channel.toString())
  //       util.addToCache(channel.url)
  //     }
  //   }
  // }
  // 
  // console.log(`Countries: ${stats.countries}. Languages: ${stats.channels}. Categories: ${stats.channels}. Channels: ${stats.channels}.`)
}

main()
