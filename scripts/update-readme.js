const utils = require('./utils')
const parser = require('./parser')
const categories = require('./categories')
const db = require('./db')

db.load()

const list = {
  countries: {}
}

function main() {
  parseIndex()
  generateCountriesTable()
  generateLanguagesTable()
  generateCategoriesTable()
  generateReadme()
  finish()
}

function parseIndex() {
  console.log(`Parsing index...`)
  const items = parser.parseIndex()

  list.countries['undefined'] = {
    country: 'Undefined',
    channels: 0,
    playlist: `<code>https://iptv-org.github.io/iptv/countries/undefined.m3u</code>`,
    name: 'Undefined'
  }

  for (const item of items) {
    const playlist = parser.parsePlaylist(item.url)
    for (let channel of playlist.channels) {
      // countries
      if (!channel.countries.length) {
        list.countries['undefined'].channels++
      } else {
        for (let country of channel.countries) {
          if (list.countries[country.code]) {
            list.countries[country.code].channels++
          } else {
            let flag = utils.code2flag(country.code)
            list.countries[country.code] = {
              country: flag + '&nbsp;' + country.name,
              channels: 1,
              playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code}.m3u</code>`,
              name: country.name
            }
          }
        }
      }
    }
  }

  list.countries = Object.values(list.countries)
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

function generateCountriesTable() {
  console.log(`Generating countries table...`)
  list.countries = utils.sortBy(list.countries, ['name'])
  list.countries.forEach(function (i) {
    delete i.name
  })
  const table = utils.generateTable(list.countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ]
  })

  utils.createFile('./.readme/_countries.md', table)
}

function generateReadme() {
  console.log(`Generating README.md...`)
  utils.compileMarkdown('../.readme/config.json')
}

function finish() {
  console.log(`Done.`)
}

main()
