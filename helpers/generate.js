const util = require('./util')
const urlParser = require('url')

const types = ['full', 'country', 'content', 'sport']
const debug = false
let cache = {}
let stats = {
  total: 0,
  duplicates: 0
}

function init() {

  let countries = util.parsePlaylist('index.m3u')

  if(debug) {
    countries = countries.slice(0, 1)
  }

  for(const type of types) {
    util.createFile(`index.${type}.m3u`, '#EXTM3U\n')
  }

  for(let country of countries) {

    const countryName = util.getTitle(country.title)
    const countryCode = util.getBasename(country.file).toUpperCase()
    const playlist = util.parsePlaylist(country.file)

    for(let item of playlist) {

      const channel = util.parseChannelData(item)
      

      

      const file = channel.file

      if(checkCache(file)) {

        stats.duplicates++

      } else {

        for(const type of types) {
          let groupTitle = ''
          if(type === 'full') {
            groupTitle = [ countryName, channel.group ].filter(i => i).join(';')
          } else if(type === 'country') {
            groupTitle = countryName
          } else if(type === 'content') {
            groupTitle = channel.group
          } else {
            groupTitle = channel.group
          }
          
          const info = `-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${groupTitle}",${channel.title}`
          const data = '#EXTINF:' + info + '\n' + file + '\n'

          if(type === 'sport') {
            if(groupTitle === 'Sport') {
              util.writeToFile(`index.${type}.m3u`, data)
            }
          } else {
            util.writeToFile(`index.${type}.m3u`, data)
          }
        }
        
        addToCache(file)
      
      }

      stats.total++

    }

  }
}

init()

console.log(`Total: ${stats.total}. Duplicates: ${stats.duplicates}. Unique: ${stats.total - stats.duplicates}`)

function addToCache(url) {
  let id = getUrlPath(url)

  cache[id] = true
}

function checkCache(url) {
  let id = getUrlPath(url)

  return cache.hasOwnProperty(id)
}

function getUrlPath(u) {
  let parsed = urlParser.parse(u)
  let searchQuery = parsed.search || ''

  return parsed.host + parsed.pathname + searchQuery
}