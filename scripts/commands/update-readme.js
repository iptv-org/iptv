const { file, markdown, parser, logger } = require('../core')
const { program } = require('commander')

let categories = []
let countries = []
let languages = []
let regions = []

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/config.json')
  .parse(process.argv)
  .opts()

async function main() {
  await setUp()

  await generateCategoryTable()
  await generateLanguageTable()
  await generateRegionTable()
  await generateCountryTable()

  await updateReadme()
}

main()

async function generateCategoryTable() {
  logger.info('Generating category table...')

  const rows = []
  for (const category of categories) {
    rows.push({
      category: category.name,
      channels: category.count,
      playlist: `<code>https://iptv-org.github.io/iptv/categories/${category.slug}.m3u</code>`
    })
  }

  const table = markdown.createTable(rows, [
    { name: 'Category', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_categories.md', table)
}

async function generateCountryTable() {
  logger.info('Generating country table...')

  const rows = []
  for (const country of countries) {
    const flag = getCountryFlag(country.code)
    const prefix = flag ? `${flag} ` : ''

    rows.push({
      country: prefix + country.name,
      channels: country.count,
      playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code.toLowerCase()}.m3u</code>`
    })
  }

  const table = markdown.createTable(rows, [
    { name: 'Country', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_countries.md', table)
}

async function generateRegionTable() {
  logger.info('Generating region table...')

  const rows = []
  for (const region of regions) {
    rows.push({
      region: region.name,
      channels: region.count,
      playlist: `<code>https://iptv-org.github.io/iptv/regions/${region.code.toLowerCase()}.m3u</code>`
    })
  }

  const table = markdown.createTable(rows, [
    { name: 'Region', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_regions.md', table)
}

async function generateLanguageTable() {
  logger.info('Generating language table...')

  const rows = []
  for (const language of languages) {
    rows.push({
      language: language.name,
      channels: language.count,
      playlist: `<code>https://iptv-org.github.io/iptv/languages/${language.code}.m3u</code>`
    })
  }

  const table = markdown.createTable(rows, [
    { name: 'Language', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_languages.md', table)
}

async function updateReadme() {
  logger.info('Updating README.md...')

  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}

async function setUp() {
  categories = await parser.parseLogs(`${LOGS_PATH}/generate-playlists/categories.log`)
  countries = await parser.parseLogs(`${LOGS_PATH}/generate-playlists/countries.log`)
  languages = await parser.parseLogs(`${LOGS_PATH}/generate-playlists/languages.log`)
  regions = await parser.parseLogs(`${LOGS_PATH}/generate-playlists/regions.log`)
}

function getCountryFlag(code) {
  switch (code) {
    case 'UK':
      return '🇬🇧'
    case 'UNDEFINED':
      return ''
    default:
      return code.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  }
}
