const utils = require('./utils')
const parser = require('./parser')
const categories = require('./categories')

const ROOT_DIR = './.gh-pages'

let list = {
  all: [],
  playlists: {},
  languages: {},
  categories: {},
  countries: {}
}

function main() {
  parseIndex()
  createRootDirectory()
  createNoJekyllFile()
  generateIndex()
  generateSFWIndex()
  generateChannelsJson()
  generateCountryIndex()
  generateLanguageIndex()
  generateCategoryIndex()
  generateCountries()
  generateLanguages()
  generateCategories()
  finish()
}

function createRootDirectory() {
  console.log('Creating root directory...')
  utils.createDir(ROOT_DIR)
}

function createNoJekyllFile() {
  console.log('Creating .nojekyll...')
  utils.createFile(`${ROOT_DIR}/.nojekyll`)
}

function parseIndex() {
  console.log(`Parsing index...`)
  const items = parser.parseIndex()

  for (const category of categories) {
    list.categories[category.id] = []
  }
  list.categories['other'] = []

  for (let item of items) {
    const playlist = parser.parsePlaylist(item.url)
    for (let channel of playlist.channels) {
      // all
      list.all.push(channel)

      // playlists
      if (!channel.countries.length) {
        const UNDEFINED = 'undefined'
        if (!list.playlists[UNDEFINED]) {
          list.playlists[UNDEFINED] = []
        }
        list.playlists[UNDEFINED].push(channel)
      } else {
        for (let country of channel.countries) {
          const countryCode = country.code || 'undefined'
          if (!list.playlists[countryCode]) {
            list.playlists[countryCode] = []
          }
          list.playlists[countryCode].push(channel)
        }
      }

      // countries
      if (!channel.countries.length) {
        const UNDEFINED = 'undefined'
        if (!list.countries[UNDEFINED]) {
          list.countries[UNDEFINED] = []
        }
        list.countries[UNDEFINED].push(channel)
      } else {
        for (let country of channel.countries) {
          const countryName = country.name
          if (!list.countries[countryName]) {
            list.countries[countryName] = []
          }
          list.countries[countryName].push(channel)
        }
      }

      // languages
      if (!channel.languages.length) {
        const UNDEFINED = 'undefined'
        if (!list.languages[UNDEFINED]) {
          list.languages[UNDEFINED] = []
        }
        list.languages[UNDEFINED].push(channel)
      } else {
        for (let language of channel.languages) {
          const languageCode = language.code || 'undefined'
          if (!list.languages[languageCode]) {
            list.languages[languageCode] = []
          }
          list.languages[languageCode].push(channel)
        }
      }

      // categories
      const categoryId = channel.category.toLowerCase()
      if (!list.categories[categoryId]) {
        list.categories['other'].push(channel)
      } else {
        list.categories[categoryId].push(channel)
      }
    }
  }

  list.countries = Object.keys(list.countries)
    .sort((a, b) => {
      if (a === 'undefined') return -1
      if (b === 'undefined') return 1

      if (a < b) return -1
      if (a > b) return 1
      return 0
    })
    .reduce((obj, key) => {
      obj[key] = list.countries[key]
      return obj
    }, {})
}

function generateIndex() {
  console.log('Generating index.m3u...')
  const filename = `${ROOT_DIR}/index.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const channels = utils.sortBy(list.all, ['name', 'url'])
  for (let channel of channels) {
    utils.appendToFile(filename, channel.toString())
  }
}

function generateSFWIndex() {
  console.log('Generating index.sfw.m3u...')
  const filename = `${ROOT_DIR}/index.sfw.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const sorted = utils.sortBy(list.all, ['name', 'url'])
  const channels = utils.filterNSFW(sorted)
  for (let channel of channels) {
    utils.appendToFile(filename, channel.toString())
  }
}

function generateChannelsJson() {
  console.log('Generating channels.json...')
  const filename = `${ROOT_DIR}/channels.json`
  const sorted = utils.sortBy(list.all, ['name', 'url'])
  const channels = sorted.map(c => c.toJSON())
  utils.createFile(filename, JSON.stringify(channels))
}

function generateCountryIndex() {
  console.log('Generating index.country.m3u...')
  const filename = `${ROOT_DIR}/index.country.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  for (let country in list.countries) {
    const channels = utils.sortBy(list.countries[country], ['name', 'url'])
    for (let channel of channels) {
      const category = channel.category
      channel.category = country !== 'undefined' ? country : ''
      utils.appendToFile(filename, channel.toString())
      channel.category = category
    }
  }
}

function generateLanguageIndex() {
  console.log('Generating index.language.m3u...')
  const filename = `${ROOT_DIR}/index.language.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const channels = utils.sortBy(list.all, ['tvgLanguage', 'name', 'url'])
  for (let channel of channels) {
    const category = channel.category
    channel.category = channel.tvgLanguage
    utils.appendToFile(filename, channel.toString())
    channel.category = category
  }
}

function generateCategoryIndex() {
  console.log('Generating index.category.m3u...')
  const filename = `${ROOT_DIR}/index.category.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const channels = utils.sortBy(list.all, ['category', 'name', 'url'])
  for (let channel of channels) {
    utils.appendToFile(filename, channel.toString())
  }
}

function generateCountries() {
  console.log('Generating /countries...')
  const outputDir = `${ROOT_DIR}/countries`
  utils.createDir(outputDir)

  for (const code in list.playlists) {
    const filename = `${outputDir}/${code}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    let channels = Object.values(list.playlists[code])
    channels = utils.sortBy(channels, ['name', 'url'])
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
    }
  }
}

function generateLanguages() {
  console.log('Generating /languages...')
  const outputDir = `${ROOT_DIR}/languages`
  utils.createDir(outputDir)

  for (const languageId in list.languages) {
    const filename = `${outputDir}/${languageId}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    let channels = Object.values(list.languages[languageId])
    channels = utils.sortBy(channels, ['name', 'url'])
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
    }
  }
}

function generateCategories() {
  console.log('Generating /categories...')
  const outputDir = `${ROOT_DIR}/categories`
  utils.createDir(outputDir)

  for (const category of categories) {
    const filename = `${outputDir}/${category.id}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    let channels = Object.values(list.categories[category.id])
    channels = utils.sortBy(channels, ['name', 'url'])
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
    }
  }
}

function finish() {
  console.log('Done.\n')

  console.log(
    `Countries: ${list.countries.length}. Languages: ${
      Object.values(list.languages).length
    }. Categories: ${Object.values(list.categories).length}. Channels: ${list.all.length}.`
  )
}

main()
