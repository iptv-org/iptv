const utils = require('./utils')
const db = require('./db')
const parser = require('./parser')

db.load()

function main() {
  start()
  generateCategoriesTable()
  generateCountriesTable()
  generateLanguagesTable()
  generateReadme()
  finish()
}

function generateCategoriesTable() {
  console.log(`Generating categories table...`)

  const categories = []
  for (const category of [...db.categories.all(), { name: 'Other', id: 'other' }]) {
    categories.push({
      category: category.name,
      channels: db.channels.forCategory(category).removeDuplicates().count(),
      playlist: `<code>https://iptv-org.github.io/iptv/categories/${category.id}.m3u</code>`
    })
  }

  const table = utils.generateTable(categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_categories.md', table)
}

function generateCountriesTable() {
  console.log(`Generating countries table...`)

  const countries = []
  for (const country of [
    ...db.countries.sortBy(['name']).all(),
    { name: 'Undefined', code: 'undefined' }
  ]) {
    let flag = utils.code2flag(country.code)
    const prefix = flag ? `${flag}&nbsp;` : ''
    countries.push({
      country: prefix + country.name,
      channels: db.channels.forCountry(country).removeDuplicates().removeNSFW().count(),
      playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code}.m3u</code>`
    })
  }

  const table = utils.generateTable(countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ]
  })

  utils.createFile('./.readme/_countries.md', table)
}

function generateLanguagesTable() {
  console.log(`Generating languages table...`)
  const languages = []

  for (const language of [
    ...db.languages.sortBy(['name']).all(),
    { name: 'Undefined', code: 'undefined' }
  ]) {
    languages.push({
      language: language.name,
      channels: db.channels.forLanguage(language).removeDuplicates().removeNSFW().count(),
      playlist: `<code>https://iptv-org.github.io/iptv/languages/${language.code}.m3u</code>`
    })
  }

  const table = utils.generateTable(languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_languages.md', table)
}

function generateReadme() {
  console.log(`Generating README.md...`)
  utils.compileMarkdown('../.readme/config.json')
}

function start() {
  console.log(`Starting...`)
}

function finish() {
  console.log(`Done.`)
}

main()
