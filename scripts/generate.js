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
  console.log('Creating root directory...')
  createRootDirectory()
  console.log('Creating .nojekyll...')
  createNoJekyllFile()
  console.log('Generating index.m3u...')
  generateIndex()
  console.log('Generating index.country.m3u...')
  generateCountryIndex()
  console.log('Generating index.language.m3u...')
  generateLanguageIndex()
  console.log('Generating index.category.m3u...')
  generateCategoryIndex()
  console.log('Generating /countries...')
  generateCountries()
  console.log('Generating /categories...')
  generateCategories()
  console.log('Generating /languages...')
  generateLanguages()
  console.log('Done.\n')

  console.log(`Countries: ${Object.values(list.countries).length}. Languages: ${Object.values(list.languages).length}. Categories: ${Object.values(list.categories).length}. Channels: ${list.all.length}.`)
}

function createRootDirectory() {
  helper.createDir(ROOT_DIR)
}

function createNoJekyllFile() {
  helper.createFile(`${ROOT_DIR}/.nojekyll`)
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
      channel.epg = playlist.header.attrs['x-tvg-url'] || ''

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

  const channels = helper.sortBy(list.all, ['title', 'url'])
  for(let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateCountryIndex() {
  const filename = `${ROOT_DIR}/index.country.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['countryName', 'title', 'url'])
  for(let channel of channels) {
    const group = channel.group
    channel.group = channel.countryName
    helper.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateLanguageIndex() {
  const filename = `${ROOT_DIR}/index.language.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['language', 'title', 'url'])
  for(let channel of channels) {
    const group = channel.group
    channel.group = channel.language
    helper.appendToFile(filename, channel.toString())
    channel.group = group
  }
}

function generateCategoryIndex() {
  const filename = `${ROOT_DIR}/index.category.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['group', 'title', 'url'])
  for(let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateCountries() {
  const outputDir = `${ROOT_DIR}/countries`
  helper.createDir(outputDir)

  for(let cid in list.countries) {
    let country = list.countries[cid]
    const filename = `${outputDir}/${cid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')

    const channels = helper.sortBy(Object.values(country), ['title', 'url'])
    for(let channel of channels) {
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

    const channels = helper.sortBy(Object.values(category), ['title', 'url'])
    for(let channel of channels) {
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

    const channels = helper.sortBy(Object.values(language), ['title', 'url'])
    for(let channel of channels) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

main()
