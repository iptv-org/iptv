const utils = require('./utils')
const db = require('./db')

db.load()

function main() {
  start()
  generateCountriesTable()
  generateLanguagesTable()
  generateCategoriesTable()
  generateReadme()
  finish()
}

function generateCountriesTable() {
  console.log(`Generating countries table...`)
  const countries = []

  for (const country of db.countries.sortBy(['name']).all()) {
    let flag = utils.code2flag(country.code)
    countries.push({
      country: flag + '&nbsp;' + country.name,
      channels: db.channels.forCountry(country).count(),
      playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code}.m3u</code>`
    })
  }

  countries.push({
    country: 'Undefined',
    channels: db.channels.forCountry({ code: null }).count(),
    playlist: `<code>https://iptv-org.github.io/iptv/countries/undefined.m3u</code>`
  })

  const table = utils.generateTable(countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ]
  })

  utils.createFile('./.readme/_countries.md', table)
}

function generateCategoriesTable() {
  console.log(`Generating categories table...`)
  const categories = []

  for (const category of db.categories.all()) {
    categories.push({
      category: category.name,
      channels: db.channels.forCategory(category).count(),
      playlist: `<code>https://iptv-org.github.io/iptv/categories/${category.id}.m3u</code>`
    })
  }

  categories.push({
    category: 'Other',
    channels: db.channels.forCategory({ id: null }).count(),
    playlist: `<code>https://iptv-org.github.io/iptv/categories/other.m3u</code>`
  })

  const table = utils.generateTable(categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_categories.md', table)
}

function generateLanguagesTable() {
  console.log(`Generating languages table...`)
  const languages = []

  for (const language of db.languages.sortBy(['name']).all()) {
    languages.push({
      language: language.name,
      channels: db.channels.forLanguage(language).count(),
      playlist: `<code>https://iptv-org.github.io/iptv/languages/${language.code}.m3u</code>`
    })
  }

  languages.push({
    language: 'Undefined',
    channels: db.channels.forLanguage({ code: null }).count(),
    playlist: `<code>https://iptv-org.github.io/iptv/languages/undefined.m3u</code>`
  })

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
