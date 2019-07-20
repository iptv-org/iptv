const parsers = require('playlist-parser')
const M3U = parsers.M3U
const fs = require("fs")
const path = require('path')

function parsePlaylist(filename) {
  return M3U.parse(fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: "utf8" }))
}

function parseChannelData(item) {
  const info = getInfo(item)

  function getTvgId(info) {
    const matches = info.match(/tvg\-id\=\"(.*?)\"/i)

    return (matches && matches.length > 1) ? matches[1] : ''
  }

  function getTvgName(info) {
    const matches = info.match(/tvg\-name\=\"(.*?)\"/i)

    return (matches && matches.length > 1) ? matches[1] : ''
  }

  function getTvgLogo(info) {
    const matches = info.match(/tvg\-logo\=\"(.*?)\"/i)

    return (matches && matches.length > 1) ? matches[1] : ''
  }

  function getGroupTitle(item) {
    const supportedGroups = [ 'Auto','Business', 'CCTV', 'Classic','Comedy','Documentary','Education','Entertainment', 'Family','Fashion','Food', 'General', 'Health', 'History', 'Hobby', 'Kids', 'Legislative','Lifestyle','Local', 'Movies', 'Music', 'News', 'Quiz','Radio', 'Religious','Sci-Fi', 'Shop', 'Sport', 'Travel', 'Weather', 'XXX' ]
    const matches = info.match(/group\-title\=\"(.*?)\"/i)
    let groupTitle = (matches && matches.length > 1) ? matches[1] : ''
    const groupIndex = supportedGroups.map(g => g.toLowerCase()).indexOf(groupTitle.toLowerCase())

    if(groupIndex === -1) {
      groupTitle = ''
    } else {
      groupTitle = supportedGroups[groupIndex]
    }

    return groupTitle
  }

  return {
    title: getTitle(info),
    file: item.file,
    id: getTvgId(info),
    name: getTvgName(info),
    logo: getTvgLogo(info),
    group: getGroupTitle(info)
  }
}

function getInfo(item) {
  return (item.artist) ? item.artist + '-' + item.title : item.title
}

function getTitle(info) {
  const parts = info.split(',')

  return parts[parts.length - 1].trim()
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

function sortByTitle(arr) {
  return arr.sort(byTitle)
}

function writeToFile(filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

function createFile(filename, data) {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

function getBasename(filename) {
  return path.basename(filename, path.extname(filename))
}

module.exports = {
  parsePlaylist,
  parseChannelData,
  getTitle,
  sortByTitle,
  writeToFile,
  createFile,
  getBasename
}