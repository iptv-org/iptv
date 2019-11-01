const util = require('./util')
const ISO6391 = require('iso-639-1')
const markdownInclude = require('markdown-include')
const path = require('path')

function main() {
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

function generateCountriesTable() {
  const root = util.parsePlaylist('index.m3u')

  let countries = []
  for(let item of root.items) {
    const playlist = util.parsePlaylist(item.url)
    const countryCode = util.getBasename(item.url).toUpperCase()
    const epg = playlist.header.attrs['x-tvg-url'] ? `<code>${playlist.header.attrs['x-tvg-url']}</code>` : ''

    countries.push({ 
      country: item.name, 
      channels: playlist.items.length, 
      playlist: `<code>https://iptv-org.github.io/iptv/${item.url}</code>`, 
      epg
    })
  }

  const table = util.generateTable(countries, {
    columns: [
      { name: 'Country', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true },
      { name: 'EPG', align: 'left' }
    ]
  })

  util.createFile('./helpers/countries.md', table)
}

function generateLanguagesTable() {
  const playlist = util.parsePlaylist('index.language.m3u')

  let languages = {}
  for(let item of playlist.items) {
    const languageName = item.group.title || 'Undefined'
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
  }

  languages = Object.values(languages)
  languages.sort((a, b) => {
    if(a.language === 'Undefined') { return 1 }
    if(b.language === 'Undefined') { return -1 }
    if(a.language < b.language) { return -1 }
    if(a.language > b.language) { return 1 }
    return 0
  })

  const table = util.generateTable(languages, {
    columns: [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  util.createFile('./helpers/languages.md', table)
}

function generateCategoriesTable() {
  const playlist = util.parsePlaylist('index.content.m3u')

  let categories = {}
  for(let item of playlist.items) {
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
  
  categories = Object.values(categories)
  categories.sort((a, b) => {
    if(a.category === 'Other') { return 1 }
    if(b.category === 'Other') { return -1 }
    if(a.category < b.category) { return -1 }
    if(a.category > b.category) { return 1 }
    return 0
  })

  const table = util.generateTable(categories, {
    columns: [
      { name: 'Category', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left' }
    ]
  })

  util.createFile('./helpers/categories.md', table)
}

function generateReadme() {
  markdownInclude.compileFiles(path.resolve(__dirname, './markdown.json'))
}

main()
