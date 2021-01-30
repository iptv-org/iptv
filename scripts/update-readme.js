const utils = require('./utils')
const parser = require('./parser')

const list = {
  countries: [],
  languages: [],
  categories: []
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

  const countries = {}
  const languages = {}
  const categories = {}

  countries['undefined'] = {
    country: 'Undefined',
    channels: 0,
    playlist: `<code>https://iptv-org.github.io/iptv/countries/undefined.m3u</code>`,
    epg: '',
    name: 'Undefined'
  }

  languages['undefined'] = {
    language: 'Undefined',
    channels: 0,
    playlist: `<code>https://iptv-org.github.io/iptv/languages/undefined.m3u</code>`
  }

  for (const category of utils.supportedCategories) {
    categories[category.id] = {
      category: category.name,
      channels: 0,
      playlist: `<code>https://iptv-org.github.io/iptv/categories/${category.id}.m3u</code>`
    }
  }
  categories['other'] = {
    category: 'Other',
    channels: 0,
    playlist: `<code>https://iptv-org.github.io/iptv/categories/other.m3u</code>`
  }

  for (const item of items) {
    const playlist = parser.parsePlaylist(item.url)
    for (let channel of playlist.channels) {
      // countries
      if (!channel.countries.length) {
        countries['undefined'].channels++
      } else {
        for (let country of channel.countries) {
          if (countries[country.code]) {
            countries[country.code].channels++
          } else {
            let flag = utils.code2flag(country.code)
            countries[country.code] = {
              country: flag + '&nbsp;' + country.name,
              channels: 1,
              playlist: `<code>https://iptv-org.github.io/iptv/countries/${country.code}.m3u</code>`,
              epg: playlist.header.attrs['x-tvg-url']
                ? `<code>${playlist.header.attrs['x-tvg-url']}</code>`
                : '',
              name: country.name
            }
          }
        }
      }

      // languages
      if (!channel.languages.length) {
        languages['undefined'].channels++
      } else {
        for (let language of channel.languages) {
          if (languages[language.code]) {
            languages[language.code].channels++
          } else {
            languages[language.code] = {
              language: language.name,
              channels: 1,
              playlist: `<code>https://iptv-org.github.io/iptv/languages/${language.code}.m3u</code>`
            }
          }
        }
      }

      // categories
      const categoryId = channel.category.toLowerCase()
      if (!categoryId) {
        categories['other'].channels++
      } else if (categories[categoryId]) {
        categories[categoryId].channels++
      }
    }
  }

  list.countries = Object.values(countries)
  list.languages = Object.values(languages)
  list.categories = Object.values(categories)
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
      { name: 'Playlist', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_countries.md', table)
}

function generateLanguagesTable() {
  console.log(`Generating languages table...`)
  list.languages = utils.sortBy(list.languages, ['language'])
  const table = utils.generateTable(list.languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_languages.md', table)
}

function generateCategoriesTable() {
  console.log(`Generating categories table...`)
  list.categories = utils.sortBy(list.categories, ['category'])
  const table = utils.generateTable(list.categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  utils.createFile('./.readme/_categories.md', table)
}

function generateReadme() {
  console.log(`Generating README.md...`)
  utils.compileMarkdown('../.readme/config.json')
}

function finish() {
  console.log(`Done.`)
}

main()
