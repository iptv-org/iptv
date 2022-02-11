const { file, markdown, parser, logger, api } = require('../../core')
const { create: createTable } = require('../../core/table')
const { program } = require('commander')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/generators'

const options = program
  .option('-c, --config <config>', 'Set path to config file', '.readme/config.json')
  .parse(process.argv)
  .opts()

async function main() {
  await createCategoryTable()
  await createCountryTable()
  await createLanguageTable()
  await createRegionTable()
  await updateReadme()
}

main()

async function createCategoryTable() {
  logger.info('creating category table...')
  const rows = []
  await api.categories.load()
  const items = await parser.parseLogs(`${LOGS_DIR}/categories.log`)
  for (const item of items) {
    const id = file.getFilename(item.filepath)
    const category = await api.categories.find({ id })
    rows.push({
      name: category ? category.name : 'Undefined',
      channels: item.count,
      playlist: `<code>https://iptv-org.github.io/iptv/${item.filepath}</code>`
    })
  }

  const table = createTable(rows, [
    { name: 'Category' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', nowrap: true }
  ])

  await file.create('./.readme/_categories.md', table)
}

async function createCountryTable() {
  logger.info('creating country table...')
  const rows = []
  await api.countries.load()
  const items = await parser.parseLogs(`${LOGS_DIR}/countries.log`)
  for (const item of items) {
    const code = file.getFilename(item.filepath)
    const country = await api.countries.find({ code: code.toUpperCase() })
    rows.push({
      name: country ? `${country.flag} ${country.name}` : 'Undefined',
      channels: item.count,
      playlist: `<code>https://iptv-org.github.io/iptv/${item.filepath}</code>`
    })
  }

  const table = createTable(rows, [
    { name: 'Country' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', nowrap: true }
  ])

  await file.create('./.readme/_countries.md', table)
}

async function createLanguageTable() {
  logger.info('creating language table...')
  const rows = []
  await api.languages.load()
  const items = await parser.parseLogs(`${LOGS_DIR}/languages.log`)
  for (const item of items) {
    const code = file.getFilename(item.filepath)
    const language = await api.languages.find({ code })
    rows.push({
      name: language ? language.name : 'Undefined',
      channels: item.count,
      playlist: `<code>https://iptv-org.github.io/iptv/${item.filepath}</code>`
    })
  }

  const table = createTable(rows, [
    { name: 'Language', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_languages.md', table)
}

async function createRegionTable() {
  logger.info('creating region table...')
  const rows = []
  await api.regions.load()
  const items = await parser.parseLogs(`${LOGS_DIR}/regions.log`)
  for (const item of items) {
    const code = file.getFilename(item.filepath)
    const region = await api.regions.find({ code: code.toUpperCase() })
    rows.push({
      name: region ? region.name : 'Undefined',
      channels: item.count,
      playlist: `<code>https://iptv-org.github.io/iptv/${item.filepath}</code>`
    })
  }

  const table = createTable(rows, [
    { name: 'Region', align: 'left' },
    { name: 'Channels', align: 'right' },
    { name: 'Playlist', align: 'left', nowrap: true }
  ])

  await file.create('./.readme/_regions.md', table)
}

async function updateReadme() {
  logger.info('updating readme.md...')
  const config = require(file.resolve(options.config))
  await file.createDir(file.dirname(config.build))
  await markdown.compile(options.config)
}
