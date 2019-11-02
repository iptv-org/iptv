const fs = require("fs")
const path = require('path')
const playlistParser = require('iptv-playlist-parser')
const axios = require('axios')
const zlib = require("zlib")
const epgParser = require('epg-parser')
const urlParser = require('url')
const ISO6391 = require('iso-639-1')
const escapeStringRegexp = require('escape-string-regexp')
const markdownInclude = require('markdown-include')

let cache = {}
let helper = {}

helper.createDir = function(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

helper.compileMarkdown = function(filepath) {
  return markdownInclude.compileFiles(path.resolve(__dirname, filepath))
}

helper.escapeStringRegexp = function(scring) {
  return escapeStringRegexp(string)
}

helper.getISO6391Name = function(code) {
  return ISO6391.getName(code)
}

helper.getISO6391Code = function(name) {
  return ISO6391.getCode(name)
}

helper.parsePlaylist = function(filename) {
  const content = this.readFile(filename)
  const result = playlistParser.parse(content)

  return new Playlist(result)
}

helper.createChannel = function(data) {
  return new Channel({
    id: data.tvg.id,
    name: data.tvg.name,
    language: data.tvg.language,
    logo: data.tvg.logo,
    group: data.group.title,
    url: data.url,
    title: data.name
  })
}

helper.loadEPG = async function(url) {
  const content = await getEPGFile(url)
  const result = epgParser.parse(content)
  const channels = {}
  for(let channel of result.channels) {
    channels[channel.id] = channel
  }

  return Promise.resolve({ 
    url, 
    channels
  })
}

helper.getEPGFile = function(url) {
  return new Promise((resolve, reject) => {
    var buffer = []
    axios({
      method: 'get',
      url: url,
      responseType:'stream'
    }).then(res => {
      let stream
      if(/\.gz$/i.test(url)) {
        let gunzip = zlib.createGunzip()         
        res.data.pipe(gunzip)
        stream = gunzip
      } else {
        stream = res.data        
      }

      stream.on('data', function(data) {
        buffer.push(data.toString())
      }).on("end", function() {
        resolve(buffer.join(""))
      }).on("error", function(e) {
        reject(e)
      })
    }).catch(e => {
      reject(e)
    })
  })
}

helper.sortByTitleAndUrl = function(arr) {
  return arr.sort(function(a, b) {
    var titleA = a.title.toLowerCase()
    var titleB = b.title.toLowerCase()
    var urlA = a.url.toLowerCase()
    var urlB = b.url.toLowerCase()
    
    if(titleA < titleB) return -1
    if(titleA > titleB) return 1

    if(urlA < urlB) return -1
    if(urlA > urlB) return 1

    return 0
  })
}

helper.readFile = function(filename) {
  return fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: "utf8" })
}

helper.appendToFile = function(filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.createFile = function(filename, data) {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.getBasename = function(filename) {
  return path.basename(filename, path.extname(filename))
}

helper.addToCache = function(url) {
  let id = this.getUrlPath(url)

  cache[id] = true
}

helper.checkCache = function(url) {
  let id = this.getUrlPath(url)

  return cache.hasOwnProperty(id)
}

helper.clearCache = function() {
  cache = {}
}

helper.getUrlPath = function(u) {
  let parsed = urlParser.parse(u)
  let searchQuery = parsed.search || ''
  let path = parsed.host + parsed.pathname + searchQuery

  return path.toLowerCase()
}

helper.validateUrl = function(channelUrl) {
  const url = new URL(channelUrl)
  const host = url.hostname
  const blacklist = [
    '80.80.160.168', // repeats on a loop
    '63.237.48.3', // not a live stream
    '189.216.247.113', // not working streams
  ]

  return blacklist.indexOf(host) === -1
}

helper.skipPlaylist = function(filename) {
  let testCountry = process.env.npm_config_country
  let excludeList = process.env.npm_config_exclude
  let excludeCountries = excludeList ? excludeList.split(',') : []
  
  if (testCountry && filename !== 'channels/' + testCountry + '.m3u') return true
  
  for(const countryCode of excludeCountries) {
    if (filename === 'channels/' + countryCode + '.m3u') return true
  }

  return false
}

helper.generateTable = function(data, options) {
  let output = '<table>'

  output += '<thead><tr>'
  for (let column of options.columns) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr></thead>'

  output += '<tbody>'
  for (let item of data) {
    output += '<tr>'
    let i = 0
    for (let prop in item) {
      const column = options.columns[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>'
  }
  output += '</tbody>'

  output += '</table>'

  return output
}

class Playlist {
  constructor(data) {
    this.header = data.header
    this.items = data.items
  }

  getHeader() {
    let parts = ['#EXTM3U']
    for(let key in this.header.attrs) {
      let value = this.header.attrs[key]
      if(value) {
        parts.push(`${key}="${value}"`)
      }
    }

    return `${parts.join(' ')}\n`
  }
}

class Channel {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.language = this._filterLanguage(data.language)
    this.logo = data.logo
    this.group = this._filterGroup(data.group)
    this.url = data.url
    this.title = data.title
  }

  _filterGroup(groupTitle) {
    if(!groupTitle) return ''
      
    const supportedCategories = [ 'Auto','Business', 'Classic','Comedy','Documentary','Education','Entertainment', 'Family','Fashion','Food', 'General', 'Health', 'History', 'Hobby', 'Kids', 'Legislative','Lifestyle','Local', 'Movies', 'Music', 'News', 'Quiz', 'Religious','Sci-Fi', 'Shop', 'Sport', 'Travel', 'Weather', 'XXX' ]
    const groupIndex = supportedCategories.map(g => g.toLowerCase()).indexOf(groupTitle.toLowerCase())

    if(groupIndex === -1) {
      groupTitle = ''
    } else {
      groupTitle = supportedCategories[groupIndex]
    }

    return groupTitle
  }

  _filterLanguage(languageName) {
    if(ISO6391.getCode(languageName) !== '') {
      return languageName
    }

    return ''
  }

  toString() {
    const info = `-1 tvg-id="${this.id}" tvg-name="${this.name}" tvg-language="${this.language}" tvg-logo="${this.logo}" group-title="${this.group}",${this.title}`

    return '#EXTINF:' + info + '\n' + this.url + '\n'
  }
}

module.exports = helper