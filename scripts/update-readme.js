const helper = require('./helper')

let output = {
  countries: [],
  languages: [],
  categories: []
}

function main() {
  console.log(`Parsing index...`)
  parseIndex()
  console.log(`Generating countries table...`)
  generateCountriesTable()
  console.log(`Generating languages table...`)
  generateLanguagesTable()
  console.log(`Generating categories table...`)
  generateCategoriesTable()
  console.log(`Generating README.md...`)
  generateReadme()
  console.log(`Done.`)
}

function parseIndex() {
  const root = helper.parsePlaylist('index.m3u')

  let countries = {}
  let languages = {}
  let categories = {}
  for (let rootItem of root.items) {
    const playlist = helper.parsePlaylist(rootItem.url)
    const countryName = rootItem.name
    const countryCode = helper.getBasename(rootItem.url).toLowerCase()
    const countryEpg = playlist.header.attrs['x-tvg-url']
      ? `<code>${playlist.header.attrs['x-tvg-url']}</code>`
      : ''

    for (let item of playlist.items) {
      // countries
      if (countries[countryCode]) {
        countries[countryCode].channels++
      } else {
        let flag = helper.code2flag(countryCode)

        countries[countryCode] = {
          country: flag + '&nbsp;' + countryName,
          channels: 1,
          playlist: `<code>https://iptv-org.github.io/iptv/countries/${countryCode}.m3u</code>`,
          epg: countryEpg
        }
      }

      // languages
      const languageNames = item.tvg.language || 'Undefined'
      for (let languageName of languageNames.split(';')) {
        let languageCode = 'undefined'
        if (languageName !== 'Undefined') {
          languageCode = helper.getISO6391Code(languageName)
          if (!languageCode) continue
        }

        if (languages[languageCode]) {
          languages[languageCode].channels++
        } else {
          languages[languageCode] = {
            language: languageName,
            channels: 1,
            playlist: `<code>https://iptv-org.github.io/iptv/languages/${languageCode}.m3u</code>`
          }
        }
      }

      // categories
      const categoryName = item.group.title || 'Other'
      const categoryCode = categoryName.toLowerCase()
      if (categories[categoryCode]) {
        categories[categoryCode].channels++
      } else {
        categories[categoryCode] = {
          category: categoryName,
          channels: 1,
          playlist: `<code>https://iptv-org.github.io/iptv/categories/${categoryCode}.m3u</code>`
        }
      }
    }
  }

  output.countries = Object.values(countries)
  output.languages = Object.values(languages)
  output.categories = Object.values(categories)
}

function generateCountriesTable() {
  const table = helper.generateTable(output.countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left' }
    ]
  })

  helper.createFile('./.readme/_countries.md', table)
}

function generateLanguagesTable() {
  output.languages.sort((a, b) => {
    if (a.language === 'Undefined') {
      return 1
    }
    if (b.language === 'Undefined') {
      return -1
    }
    if (a.language < b.language) {
      return -1
    }
    if (a.language > b.language) {
      return 1
    }
    return 0
  })

  const table = helper.generateTable(output.languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  helper.createFile('./.readme/_languages.md', table)
}

function generateCategoriesTable() {
  output.categories.sort((a, b) => {
    if (a.category === 'Other') {
      return 1
    }
    if (b.category === 'Other') {
      return -1
    }
    if (a.category < b.category) {
      return -1
    }
    if (a.category > b.category) {
      return 1
    }
    return 0
  })

  const table = helper.generateTable(output.categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  helper.createFile('./.readme/_categories.md', table)
}

function generateReadme() {
  helper.compileMarkdown('../.readme/config.json')
}

main()
