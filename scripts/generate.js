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
  generateLanguages()
  generateCountries()
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

  const sfwFilename = `${ROOT_DIR}/index.sfw.m3u`
  utils.createFile(sfwFilename, '#EXTM3U\n')

  const channels = db.channels.sortBy(['name', 'url']).all()
  for (const channel of channels) {
    utils.appendToFile(filename, channel.toString())
    if (channel.isSFW()) {
      utils.appendToFile(sfwFilename, channel.toString())
    }
  }
}

function generateCategoryIndex() {
  console.log('Generating index.category.m3u...')
  const filename = `${ROOT_DIR}/index.category.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const sfwFilename = `${ROOT_DIR}/index.category.sfw.m3u`
  utils.createFile(sfwFilename, '#EXTM3U\n')

  const channels = db.channels.sortBy(['category', 'name', 'url']).all()
  for (const channel of channels) {
    utils.appendToFile(filename, channel.toString())
    if (channel.isSFW()) {
      utils.appendToFile(sfwFilename, channel.toString())
    }
  }
}

function generateCountryIndex() {
  console.log('Generating index.country.m3u...')
  const filename = `${ROOT_DIR}/index.country.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const sfwFilename = `${ROOT_DIR}/index.country.sfw.m3u`
  utils.createFile(sfwFilename, '#EXTM3U\n')

  const unsorted = db.playlists.only(['unsorted'])[0]
  for (const channel of unsorted.channels) {
    const category = channel.category
    const sfw = channel.isSFW()
    channel.category = ''
    utils.appendToFile(filename, channel.toString())
    if (sfw) {
      utils.appendToFile(sfwFilename, channel.toString())
    }
    channel.category = category
  }

  const playlists = db.playlists.sortBy(['country']).except(['unsorted'])
  for (const playlist of playlists) {
    for (const channel of playlist.channels) {
      const category = channel.category
      const sfw = channel.isSFW()
      channel.category = playlist.country
      utils.appendToFile(filename, channel.toString())
      if (sfw) {
        utils.appendToFile(sfwFilename, channel.toString())
      }
      channel.category = category
    }
  }
}

function generateLanguageIndex() {
  console.log('Generating index.language.m3u...')
  const filename = `${ROOT_DIR}/index.language.m3u`
  utils.createFile(filename, '#EXTM3U\n')

  const sfwFilename = `${ROOT_DIR}/index.language.sfw.m3u`
  utils.createFile(sfwFilename, '#EXTM3U\n')

  const channels = db.channels.sortBy(['name', 'url']).forLanguage({ code: null }).get()
  for (const channel of channels) {
    const category = channel.category
    const sfw = channel.isSFW()
    channel.category = ''
    utils.appendToFile(filename, channel.toString())
    if (sfw) {
      utils.appendToFile(sfwFilename, channel.toString())
    }
    channel.category = category
  }

  const languages = db.languages.sortBy(['name']).all()
  for (const language of languages) {
    const channels = db.channels.sortBy(['name', 'url']).forLanguage(language).get()
    for (const channel of channels) {
      const category = channel.category
      const sfw = channel.isSFW()
      channel.category = language.name
      utils.appendToFile(filename, channel.toString())
      if (sfw) {
        utils.appendToFile(sfwFilename, channel.toString())
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

    const buffer = []
    const channels = db.channels.sortBy(['name', 'url']).forCategory(category).get()
    for (const channel of channels) {
      const info = channel.toString()
      if (!buffer.includes(info)) {
        utils.appendToFile(filename, channel.toString())
        buffer.push(info)
      }
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

    const sfwFilename = `${outputDir}/${country.code}.sfw.m3u`
    utils.createFile(sfwFilename, '#EXTM3U\n')

    const channels = db.channels.sortBy(['name', 'url']).forCountry(country).get()
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
      if (channel.isSFW()) {
        utils.appendToFile(sfwFilename, channel.toString())
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

    const sfwFilename = `${outputDir}/${language.code}.sfw.m3u`
    utils.createFile(sfwFilename, '#EXTM3U\n')

    const channels = db.channels.sortBy(['name', 'url']).forLanguage(language).get()
    for (const channel of channels) {
      utils.appendToFile(filename, channel.toString())
      if (channel.isSFW()) {
        utils.appendToFile(sfwFilename, channel.toString())
      }
    }
  }
}

function generateChannelsJson() {
  console.log('Generating channels.json...')
  const filename = `${ROOT_DIR}/channels.json`
  const channels = db.channels
    .sortBy(['name', 'url'])
    .all()
    .map(c => c.toJSON())
  utils.createFile(filename, JSON.stringify(channels))
}

function finish() {
  console.log(
    `\nTotal: ${db.channels.count()} channels, ${db.countries.count()} countries, ${db.languages.count()} languages, ${db.categories.count()} categories.`
  )
}

main()
