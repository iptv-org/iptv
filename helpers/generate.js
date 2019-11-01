const util = require('./util')
const ISO6391 = require('iso-639-1')

let list = {
  all: [],
  countries: {},
  languages: {},
  categories: {}
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
  console.log('Generating /categories...')
  generateCategories()
  console.log('Generating /languages...')
  generateLanguages()
  console.log('Done.\n')

  console.log(`Countries: ${Object.values(list.countries).length}. Languages: ${Object.values(list.languages).length}. Categories: ${Object.values(list.categories).length}. Channels: ${list.all.length}.`)
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

function generateCategories() {
  for(let cid in list.categories) {
    let category = list.categories[cid]
    const filename = `categories/${cid}.m3u`
    util.createFile(filename, '#EXTM3U\n')
    for(let channel of category) {
      util.appendToFile(filename, channel.toString())
    }
  }
}

function generateLanguages() {
  for(let lid in list.languages) {
    let language = list.languages[lid]
    const filename = `languages/${lid}.m3u`
    util.createFile(filename, '#EXTM3U\n')
    for(let channel of language) {
      util.appendToFile(filename, channel.toString())
    }
  }
}

main()
