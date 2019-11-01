const util = require('./util')
const ISO6391 = require('iso-639-1')
const markdownInclude = require('markdown-include')
const path = require('path')

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
  const root = util.parsePlaylist('index.m3u')

  let languages = {}
  let categories = {}
  for(let rootItem of root.items) {
    const playlist = util.parsePlaylist(rootItem.url)
    const countryCode = util.getBasename(rootItem.url).toUpperCase()
    const epg = playlist.header.attrs['x-tvg-url'] ? `<code>${playlist.header.attrs['x-tvg-url']}</code>` : ''

    // country
    output.countries.push({ 
      country: rootItem.name, 
      channels: playlist.items.length, 
      playlist: `<code>https://iptv-org.github.io/iptv/${rootItem.url}</code>`, 
      epg
    })

    for(let item of playlist.items) {
      
      // language
      const languageName = item.tvg.language || 'Undefined'
      const languageCode = ISO6391.getCode(languageName) || 'undefined'
      if(languages[languageCode]) { 
        languages[languageCode].channels++
      } else {
        languages[languageCode] = { 
          language: languageName, 
          channels: 1, 
          playlist: `<code>https://iptv-org.github.io/iptv/languages/${languageCode}.m3u</code>` 
        }
      }

      // category
      const categoryName = util.supportedCategories.find(c => c === item.group.title) || 'Other'
      const categoryCode = categoryName.toLowerCase()
      if(categories[categoryCode]) {
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

  output.languages = Object.values(languages)
  output.categories = Object.values(categories)
}

function generateCountriesTable() {
  const table = util.generateTable(output.countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left' }
    ]
  })

  util.createFile('./.readme/_countries.md', table)
}

function generateLanguagesTable() {
  output.languages.sort((a, b) => {
    if(a.language === 'Undefined') { return 1 }
    if(b.language === 'Undefined') { return -1 }
    if(a.language < b.language) { return -1 }
    if(a.language > b.language) { return 1 }
    return 0
  })

  const table = util.generateTable(output.languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  util.createFile('./.readme/_languages.md', table)
}

function generateCategoriesTable() {
  output.categories.sort((a, b) => {
    if(a.category === 'Other') { return 1 }
    if(b.category === 'Other') { return -1 }
    if(a.category < b.category) { return -1 }
    if(a.category > b.category) { return 1 }
    return 0
  })

  const table = util.generateTable(output.categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  util.createFile('./.readme/_categories.md', table)
}

function generateReadme() {
  markdownInclude.compileFiles(path.resolve(__dirname, '../.readme/config.json'))
}

main()
