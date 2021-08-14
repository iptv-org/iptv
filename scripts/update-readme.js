const utils = require('./helpers/utils')
const file = require('./helpers/file')
const log = require('./helpers/log')
const db = require('./helpers/db')

async function main() {
  log.start()
  await loadDatabase()
  generateCategoriesTable()
  generateCountriesTable()
  generateLanguagesTable()
  generateReadme()
  log.finish()
}

async function loadDatabase() {
  log.print('Loading database...\n')
  await db.load()
}

function generateCategoriesTable() {
  log.print('Generating categories table...\n')

  const categories = []
  for (const category of [...db.categories.all(), { name: 'Other', id: 'other' }]) {
    categories.push({
      category: category.name,
      channels: db.channels.forCategory(category).removeOffline().removeDuplicates().count(),
      playlist: `<code>https://iptv-org.github.io/iptv/categories/${category.id}.m3u</code>`
    })
  }

  const table = generateTable(categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  file.create('./.readme/_categories.md', table)
}

function generateCountriesTable() {
  log.print('Generating countries table...\n')

  const countries = []
  for (const country of [
    ...db.countries.sortBy(['name']).all(),
    { name: 'Undefined', code: 'undefined' }
  ]) {
    let flag = utils.code2flag(country.code)
    const prefix = flag ? `${flag}&nbsp;` : ''
    countries.push({
      country: prefix + country.name,
      channels: db.channels
        .forCountry(country)
        .removeOffline()
        .removeDuplicates()
        .removeNSFW()
        .count(),
      playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code}.m3u</code>`
    })
  }

  const table = generateTable(countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ]
  })

  file.create('./.readme/_countries.md', table)
}

function generateLanguagesTable() {
  log.print('Generating languages table...\n')
  const languages = []

  for (const language of [
    ...db.languages.sortBy(['name']).all(),
    { name: 'Undefined', code: 'undefined' }
  ]) {
    languages.push({
      language: language.name,
      channels: db.channels
        .forLanguage(language)
        .removeOffline()
        .removeDuplicates()
        .removeNSFW()
        .count(),
      playlist: `<code>https://iptv-org.github.io/iptv/languages/${language.code}.m3u</code>`
    })
  }

  const table = generateTable(languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  file.create('./.readme/_languages.md', table)
}

function generateTable(data, options) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of options.columns) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let item of data) {
    output += '\t\t<tr>'
    let i = 0
    for (let prop in item) {
      const column = options.columns[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

function generateReadme() {
  log.print('Generating README.md...\n')
  file.compileMarkdown('.readme/config.json')
}

main()
