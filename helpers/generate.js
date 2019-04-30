const parsers = require('playlist-parser')
const M3U = parsers.M3U
const fs = require("fs")
const path = require('path')
const urlParser = require('url')

let outputPath = path.resolve(__dirname) + '/../index.all.m3u'
let channels = 0
let duplicates = 0
let cache = {}

fs.writeFileSync(outputPath, '#EXTM3U\n')

function init() {

  let countries = loadPlaylist('index.m3u')
  // countries = countries.slice(0, 2)

  for(let country of countries) {

    const playlist = loadPlaylist(country.file)

    for(let item of playlist) {

      let title = (item.artist) ? item.length + ',' + item.artist + '-' + item.title : item.title

      let url = item.file

      if(checkCache(url)) {

        duplicates++

      } else {

        writeToFile(title, url)

        addToCache(url)
      
      }

      channels++

    }

  }
}

init()

console.log(`Total: ${channels}. Duplicates: ${duplicates}.`)


function loadPlaylist(filename) {
  return M3U.parse(fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: "utf8" }))
}

function writeToFile(title, file) {
  fs.appendFileSync(outputPath, '#EXTINF:' + title + '\n' + file + '\n')
}

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