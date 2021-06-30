const db = require('./db')
const utils = require('./utils')

const ROOT_DIR = './.gh-pages'

db.load()

function main() {
  createRootDirectory()
  createNoJekyllFile()
  generateIndex()
  generateCategoryIndex()
  generateCountryIndex()
  generateLanguageIndex()
  generateCategories()
  generateCountries()
  generateLanguages()
  generateChannelsJson()
  finish()
}

function createRootDirectory() {
  console.log('Creating .gh-pages folder...')
  utils.createDir(ROOT_DIR)
}

function createNoJekyllFile() {
  console.log('Creating .nojekyll...')
  utils.createFile(`${ROOT_DIR}/.nojekyll`)
}

function generateIndex() {
  console.log('Generating index.m3u...')
  const filename = `${ROOT_DIR}/index.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const nsfwFilename = `${ROOT_DIR}/index.nsfw.m3u`
  utils.createFile(nsfwFilename, '#EXTM3U\n')

  const channels = db.channels.sortBy(['name', 'url']).removeDuplicates().get()
  for (const channel of channels) {
    if (!channel.isNSFW()) {
      utils.appendToFile(filename, channel.toString())
    }
    utils.appendToFile(nsfwFilename, channel.toString())
  }
}

function generateCategoryIndex() {
  console.log('Generating index.category.m3u...')
  const filename = `${ROOT_DIR}/index.category.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const channels = db.channels.sortBy(['category', 'name', 'url']).removeDuplicates().get()
  for (const channel of channels) {
    utils.appendToFile(filename, channel.toString())
  }
}

function generateCountryIndex() {
  console.log('Generating index.country.m3u...')
  const filename = `${ROOT_DIR}/index.country.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  for (const country of [{ code: 'undefined' }, ...db.countries.sortBy(['name']).all()]) {
    const channels = db.channels
      .sortBy(['name', 'url'])
      .forCountry(country)
      .removeDuplicates()
      .get()
    for (const channel of channels) {
      const category = channel.category
      const nsfw = channel.isNSFW()
      channel.category = country.name || ''
      if (!nsfw) {
        utils.appendToFile(filename, channel.toString())
      }
      channel.category = category
    }
  }
}

function generateLanguageIndex() {
  console.log('Generating index.language.m3u...')
  const filename = `${ROOT_DIR}/index.language.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  for (const language of [{ code: 'undefined' }, ...db.languages.sortBy(['name']).all()]) {
    const channels = db.channels
      .sortBy(['name', 'url'])
      .forLanguage(language)
      .removeDuplicates()
      .get()
    for (const channel of channels) {
      const category = channel.category
      const nsfw = channel.isNSFW()
      channel.category = language.name || ''
      if (!nsfw) {
        utils.appendToFile(filename, channel.toString())
      }
      channel.category = category
    }
  }
}

function generateCategories() {
  console.log(`Generating /categories...`)
  const outputDir = `${ROOT_DIR}/categories`
  utils.createDir(outputDir)

  for (const category of [...db.categories.all(), { id: 'other' }]) {
    const filename = `${outputDir}/${category.id}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    const channels = db.channels
      .sortBy(['name', 'url'])
      .forCategory(category)
      .removeDuplicates()
      .get()
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
    }
  }
}

function generateCountries() {
  console.log(`Generating /countries...`)
  const outputDir = `${ROOT_DIR}/countries`
  utils.createDir(outputDir)

  for (const country of [...db.countries.all(), { code: 'undefined' }]) {
    const filename = `${outputDir}/${country.code}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    const channels = db.channels
      .sortBy(['name', 'url'])
      .forCountry(country)
      .removeDuplicates()
      .get()
    for (const channel of channels) {
      if (!channel.isNSFW()) {
        utils.appendToFile(filename, channel.toString())
      }
    }
  }
}

function generateLanguages() {
  console.log(`Generating /languages...`)
  const outputDir = `${ROOT_DIR}/languages`
  utils.createDir(outputDir)

  for (const language of [...db.languages.all(), { code: 'undefined' }]) {
    const filename = `${outputDir}/${language.code}.m3u`
    utils.createFile(filename, '#EXTM3U\n')

    const channels = db.channels
      .sortBy(['name', 'url'])
      .forLanguage(language)
      .removeDuplicates()
      .get()
    for (const channel of channels) {
      if (!channel.isNSFW()) {
        utils.appendToFile(filename, channel.toString())
      }
    }
  }
}

function generateChannelsJson() {
  console.log('Generating channels.json...')
  const filename = `${ROOT_DIR}/channels.json`
  const channels = db.channels
    .sortBy(['name', 'url'])
    .get()
    .map(c => c.toObject())
  utils.createFile(filename, JSON.stringify(channels))
}

function finish() {
  console.log(
    `\nTotal: ${db.channels.count()} channels, ${db.countries.count()} countries, ${db.languages.count()} languages, ${db.categories.count()} categories.`
  )
}

main()
