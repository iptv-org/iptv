const parsers = require('playlist-parser')
const M3U = parsers.M3U
const fs = require("fs")
const path = require('path')
const helper = require('./helper')

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
  let id = helper.getUrlPath(url)

  cache[id] = true
}

function checkCache(url) {
  let id = helper.getUrlPath(url)

  return cache.hasOwnProperty(id)
}