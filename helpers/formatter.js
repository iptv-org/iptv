const parsers = require('playlist-parser')
const M3U = parsers.M3U
const fs = require("fs")
const path = require('path')
const urlParser = require('url')

let total = 0
const supportedGroups = [ 
  'Auto',
  'Business', 
  'CCTV', 
  'Classic',
  'Comedy',
  'Documentary',
  'Education',
  'Entertainment', 
  'Family',
  'Fashion',
  'Food', 
  'General', 
  'Health', 
  'History', 
  'Hobby', 
  'Kids', 
  'Legislative',
  'Lifestyle',
  'Local', 
  'Movies', 
  'Music', 
  'News', 
  'Quiz',
  'Radio', 
  'Religious',
  'Sci-Fi', 
  'Shop', 
  'Sport', 
  'Travel', 
  'Weather', 
  'XXX'
]

function init() {

  let countries = loadPlaylist('index.m3u')
  // countries = countries.slice(0, 4)

  let channels = []

  for(let country of countries) {

    const playlist = loadPlaylist(country.file)

    for(let item of playlist) {

      let channel = {
        title: parseTitle(item),
        file: item.file,
        id: parseTvgId(item),
        name: parseTvgName(item),
        logo: parseTvgLogo(item),
        group: parseGroupTitle(item)
      }

      channels.push(channel)

    }

    channels = channels.sort(byTitle)

    let outputPath = path.resolve(__dirname) + '/../' + country.file

    fs.writeFileSync(outputPath, '#EXTM3U\n')

    channels.forEach(channel => {
      writeToFile(outputPath, channel)
    })

    // console.log(country.title, channels)

    total += channels.length

    channels = []
  }
}

init()

console.log(`Total: ${total}.`)

function loadPlaylist(filename) {
  return M3U.parse(fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: "utf8" }))
}

function writeToFile(outputPath, channel) {
  let info = `#EXTINF:-1 tvg-id="${channel.id}" tvg-name="${channel.name}" tvg-logo="${channel.logo}" group-title="${channel.group}",${channel.title}`

  fs.appendFileSync(outputPath, info + '\n' + channel.file + '\n')
}

function getInfo(item) {
  return (item.artist) ? item.artist + '-' + item.title : item.title
}

function parseTitle(item) {
  let info = getInfo(item)
  let parts = info.split(',')

  return parts[parts.length - 1].trim()
}

function parseTvgId(item) {
  let info = getInfo(item)
  let matches = info.match(/tvg\-id\=\"(.*?)\"/i)

  return (matches && matches.length > 1) ? matches[1] : ''
}

function parseTvgName(item) {
  let info = getInfo(item)
  let matches = info.match(/tvg\-name\=\"(.*?)\"/i)

  return (matches && matches.length > 1) ? matches[1] : ''
}

function parseTvgLogo(item) {
  let info = getInfo(item)
  let matches = info.match(/tvg\-logo\=\"(.*?)\"/i)

  return (matches && matches.length > 1) ? matches[1] : ''
}

function parseGroupTitle(item) {
  let info = getInfo(item)
  let matches = info.match(/group\-title\=\"(.*?)\"/i)
  let groupTitle = (matches && matches.length > 1) ? matches[1] : ''
  let groupIndex = supportedGroups.map(g => g.toLowerCase()).indexOf(groupTitle.toLowerCase())

  if(groupIndex === -1) {
    groupTitle = 'Undefined'
  } else {
    groupTitle = supportedGroups[groupIndex]
  }

  return groupTitle
}

function byTitle(a, b) {
  var nameA = a.title.toLowerCase()
  var nameB = b.title.toLowerCase()
  if (nameA < nameB) {
    return -1
  }
  if (nameA > nameB) {
    return 1
  }

  return 0
}