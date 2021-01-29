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
  console.log('Generating index.sfw.m3u...')
  generateSFWIndex()
  console.log('Generating channels.json...')
  generateChannels()
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

  console.log(
    `Countries: ${Object.values(list.countries).length}. Languages: ${
      Object.values(list.languages).length
    }. Categories: ${Object.values(list.categories).length}. Channels: ${list.all.length}.`
  )
}

function createRootDirectory() {
  helper.createDir(ROOT_DIR)
}

function createNoJekyllFile() {
  helper.createFile(`${ROOT_DIR}/.nojekyll`)
}

function parseIndex() {
  const root = helper.parsePlaylist('index.m3u')

  for (let rootItem of root.items) {
    const playlist = helper.parsePlaylist(rootItem.url)
    for (let item of playlist.items) {
      const channel = helper.createChannel(item, playlist)
      if (!channel.url) continue

      // all
      list.all.push(channel)

      // country
      if (!channel.countries.length) {
        const countryCode = 'undefined'
        if (!list.countries[countryCode]) {
          list.countries[countryCode] = []
        }
        list.countries[countryCode].push(channel)
      } else {
        for (let country of channel.countries) {
          const countryCode = country.code || 'undefined'
          if (!list.countries[countryCode]) {
            list.countries[countryCode] = []
          }
          list.countries[countryCode].push(channel)
        }
      }

      // language
      if (!channel.languages.length) {
        const languageCode = 'undefined'
        if (!list.languages[languageCode]) {
          list.languages[languageCode] = []
        }
        list.languages[languageCode].push(channel)
      } else {
        for (let language of channel.languages) {
          const languageCode = language.code || 'undefined'
          if (!list.languages[languageCode]) {
            list.languages[languageCode] = []
          }
          list.languages[languageCode].push(channel)
        }
      }

      // category
      const categoryCode = channel.category ? channel.category.toLowerCase() : 'other'
      if (!list.categories[categoryCode]) {
        list.categories[categoryCode] = []
      }
      list.categories[categoryCode].push(channel)
    }
  }
}

function generateIndex() {
  const filename = `${ROOT_DIR}/index.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['name', 'url'])
  for (let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateSFWIndex() {
  const filename = `${ROOT_DIR}/index.sfw.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const sorted = helper.sortBy(list.all, ['name', 'url'])
  const channels = helper.filterNSFW(sorted)
  for (let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateChannels() {
  const filename = `${ROOT_DIR}/channels.json`
  const sorted = helper.sortBy(list.all, ['name', 'url'])
  const channels = sorted.map(c => c.toJSON())
  helper.createFile(filename, JSON.stringify(channels))
}

function generateCountryIndex() {
  const filename = `${ROOT_DIR}/index.country.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['countryAttribute', 'name', 'url'])
  for (let channel of channels) {
    const category = channel.category
    channel.category = channel.countries.map(c => c.name).join(';')
    helper.appendToFile(filename, channel.toString())
    channel.category = category
  }
}

function generateLanguageIndex() {
  const filename = `${ROOT_DIR}/index.language.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['languageAttribute', 'name', 'url'])
  for (let channel of channels) {
    const category = channel.category
    channel.category = channel.getLanguageAttribute()
    helper.appendToFile(filename, channel.toString())
    channel.category = category
  }
}

function generateCategoryIndex() {
  const filename = `${ROOT_DIR}/index.category.m3u`
  helper.createFile(filename, '#EXTM3U\n')

  const channels = helper.sortBy(list.all, ['category', 'name', 'url'])
  for (let channel of channels) {
    helper.appendToFile(filename, channel.toString())
  }
}

function generateCountries() {
  const outputDir = `${ROOT_DIR}/countries`
  helper.createDir(outputDir)

  for (let cid in list.countries) {
    let country = list.countries[cid]
    const filename = `${outputDir}/${cid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')

    const channels = helper.sortBy(Object.values(country), ['name', 'url'])
    for (let channel of channels) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

function generateLanguages() {
  const outputDir = `${ROOT_DIR}/languages`
  helper.createDir(outputDir)

  for (let lid in list.languages) {
    let language = list.languages[lid]
    const filename = `${outputDir}/${lid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')

    const channels = helper.sortBy(Object.values(language), ['name', 'url'])
    for (let channel of channels) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

function generateCategories() {
  const outputDir = `${ROOT_DIR}/categories`
  helper.createDir(outputDir)

  for (let cid in helper.supportedCategories) {
    let category = list.categories[cid]
    const filename = `${outputDir}/${cid}.m3u`
    helper.createFile(filename, '#EXTM3U\n')

    if (!category) continue
    const channels = helper.sortBy(Object.values(category), ['name', 'url'])
    for (let channel of channels) {
      helper.appendToFile(filename, channel.toString())
    }
  }
}

main()
