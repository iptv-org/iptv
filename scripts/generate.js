const helper = require('./helper')

const ROOT_DIR = './.gh-pages'

let list = {
  all: [],
  countries: {},
  languages: {},
  categories: {}
}

function main() {
  console.log(`Parsing index...`)
  parseIndex()
  console.log('Creating public directory...')
  createPublicDirectory()
  console.log('Generating index.m3u...')
  generateIndex()
  console.log('Generating index.country.m3u...')
  generateCountryIndex()
  console.log('Generating index.language.m3u...')
  generateLanguageIndex()
  console.log('Generating index.content.m3u...')
  generateContentIndex()
  console.log('Generating index.full.m3u...')
  generateFullIndex()
  console.log('Generating /countries...')
  generateCountries()
  console.log('Generating /categories...')
  generateCategories()
  console.log('Generating /languages...')
  generateLanguages()
  console.log('Done.\n')

  console.log(`Countries: ${Object.values(list.countries).length}. Languages: ${Object.values(list.languages).length}. Categories: ${Object.values(list.categories).length}. Channels: ${list.all.length}.`)
}

function createPublicDirectory() {
  helper.createDir(ROOT_DIR)
}

function parseIndex() {
  const root = helper.parsePlaylist('index.m3u')

  let countries = {}
  let languages = {}
  let categories = {}

  for(let rootItem of root.items) {
    const playlist = helper.parsePlaylist(rootItem.url)
    const countryCode = helper.getBasename(rootItem.url).toLowerCase()
    const countryName = rootItem.name

    for(let item of playlist.items) {
      const channel = helper.createChannel(item)
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
      const languageCode = helper.getISO6391Code(channel.language) || 'undefined'
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

function generateIndex() {
  const filename = `${ROOT_DIR}/index.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.title.toLowerCase() < b.title.toLowerCase()) { return -1 }
    if(a.title.toLowerCase() > b.title.toLowerCase()) { return 1 }
    if(a.url < b.url) { return -1 }
    if(a.url > b.url) { return 1 }
    return 0
  })

  for(let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateCountryIndex() {
  const filename = `${ROOT_DIR}/index.country.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  for(let channel of list.all) {
    const group = channel.group
    channel.group = channel.countryName
    helper.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateLanguageIndex() {
  const filename = `${ROOT_DIR}/index.language.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.language < b.language) { return -1 }
    if(a.language > b.language) { return 1 }
    if(a.title.toLowerCase() < b.title.toLowerCase()) { return -1 }
    if(a.title.toLowerCase() > b.title.toLowerCase()) { return 1 }
    if(a.url < b.url) { return -1 }
    if(a.url > b.url) { return 1 }
    return 0
  })

  for(let channel of channels) {
    const group = channel.group
    channel.group = channel.language
    helper.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateContentIndex() {
  const filename = `${ROOT_DIR}/index.content.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.group < b.group) { return -1 }
    if(a.group > b.group) { return 1 }
    if(a.title.toLowerCase() < b.title.toLowerCase()) { return -1 }
    if(a.title.toLowerCase() > b.title.toLowerCase()) { return 1 }
    if(a.url < b.url) { return -1 }
    if(a.url > b.url) { return 1 }
    return 0
  })

  for(let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateFullIndex() {
  const filename = `${ROOT_DIR}/index.full.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = list.all.sort((a, b) => {
    if(a.countryName < b.countryName) { return -1 }
    if(a.countryName > b.countryName) { return 1 }
    if(a.group < b.group) { return -1 }
    if(a.group > b.group) { return 1 }
    if(a.title.toLowerCase() < b.title.toLowerCase()) { return -1 }
    if(a.title.toLowerCase() > b.title.toLowerCase()) { return 1 }
    if(a.url < b.url) { return -1 }
    if(a.url > b.url) { return 1 }
    return 0
  })

  for(let channel of channels) {
    const group = channel.group
    channel.group = [ channel.countryName, channel.group ].filter(i => i).join(';')
    helper.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateCountries() {
  const outputDir = `${ROOT_DIR}/countries`
  helper.createDir(outputDir)

  for(let cid in list.countries) {
    let country = list.countries[cid]
    const filename = `${outputDir}/${cid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')
    for(let channel of country) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

function generateCategories() {
  const outputDir = `${ROOT_DIR}/categories`
  helper.createDir(outputDir)

  for(let cid in list.categories) {
    let category = list.categories[cid]
    const filename = `${outputDir}/${cid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')
    for(let channel of category) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

function generateLanguages() {
  const outputDir = `${ROOT_DIR}/languages`
  helper.createDir(outputDir)

  for(let lid in list.languages) {
    let language = list.languages[lid]
    const filename = `${outputDir}/${lid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')
    for(let channel of language) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

main()
