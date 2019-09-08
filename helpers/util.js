const fs = require("fs")
const path = require('path')
const M3U8FileParser = require('m3u8-file-parser')
const axios = require('axios')
const zlib = require("zlib")
const DOMParser = require('xmldom').DOMParser
const urlParser = require('url')

const supportedGroups = [ 'Auto','Business', 'CCTV', 'Classic','Comedy','Documentary','Education','Entertainment', 'Family','Fashion','Food', 'General', 'Health', 'History', 'Hobby', 'Kids', 'Legislative','Lifestyle','Local', 'Movies', 'Music', 'News', 'Quiz','Radio', 'Religious','Sci-Fi', 'Shop', 'Sport', 'Travel', 'Weather', 'XXX' ]

const blacklist = [
  '80.80.160.168', // repeats on a loop
  '63.237.48.3', // not a live stream
  '189.216.247.113', // not working streams
]

let cache = {}

class Playlist {
  constructor(data) {
    this.attrs = data.attrs
    this.items = data.items
  }

  getHeader() {
    let parts = ['#EXTM3U']
    for(let key in this.attrs) {
      let value = this.attrs[key]
      parts.push(`${key}="${value}"`)
    }

    return `${parts.join(' ')}\n`
  }
}

class Channel {
  constructor(data) {
    this.id = data.id || ''
    this.name = data.name || ''
    this.logo = data.logo || ''
    this.group = this._getGroup(data.group)
    this.url = data.url
    this.title = data.title
  }

  _getGroup(groupTitle) {
    if(!groupTitle) return ''
      
    const groupIndex = supportedGroups.map(g => g.toLowerCase()).indexOf(groupTitle.toLowerCase())

    if(groupIndex === -1) {
      groupTitle = ''
    } else {
      groupTitle = supportedGroups[groupIndex]
    }

    return groupTitle
  }

  toString() {
    const info = `-1 tvg-id="${this.id}" tvg-name="${this.name}" tvg-logo="${this.logo}" group-title="${this.group}",${this.title}`

    return '#EXTINF:' + info + '\n' + this.url + '\n'
  }
}

function parsePlaylist(filename) {
  const parser = new M3U8FileParser()
  const content = readFile(filename)
  parser.read(content)
  let results = parser.getResult()
  let contentMatches = content.match(/^.+(?=#|\n|\r)/g)
  let head = contentMatches.length ? contentMatches[0] : null
  let attrs = {}
  if(head) {
    const parts = head.split(' ').filter(p => p !== '#EXTM3U').filter(p => p)

    for(const attr of parts) {
      let attrParts = attr.split('=')
      
      attrs[attrParts[0]] = attrParts[1].replace(/\"/g, '')
    }
  }

  results.attrs = attrs

  return new Playlist({
    attrs: results.attrs,
    items: results.segments
  })
}

function createChannel(data) {
  return new Channel({
    id: data.id,
    name: data.name,
    logo: data.logo,
    group: data.group,
    url: data.url,
    title: data.title
  })
}

async function loadEPG(url) {
  const data = await getGzipped(url)
  const doc = new DOMParser().parseFromString(data, 'text/xml')
  const channelElements = doc.getElementsByTagName('channel')
  let channels = {}
  for(let i = 0; i < channelElements.length; i++) {
    let channel = {}
    let channelElement = channelElements[i]
    channel.id = channelElement.getAttribute('id')
    channel.names = []
    for(let nameElement of Object.values(channelElement.getElementsByTagName('display-name'))) {
      if(nameElement.firstChild) {
        channel.names.push(nameElement.firstChild.nodeValue)
      }
    }
    channel.names = channel.names.filter(n => n)
    const iconElements = channelElement.getElementsByTagName('icon')
    if(iconElements.length) {
      channel.icon = iconElements[0].getAttribute('src')
    }

    channels[channel.id] = channel
  }

  return Promise.resolve({ 
    url, 
    channels 
  })
}

function getGzipped(url) {
  const supportedTypes = ['application/x-gzip', 'application/octet-stream']

  return new Promise((resolve, reject) => {
    var buffer = []
    axios({
      method: 'get',
      url: url,
      responseType:'stream'
    }).then(res => {
      let stream
      if(supportedTypes.indexOf(res.headers['content-type']) > -1) {
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

function byTitleAndUrl(a, b) {
  var titleA = a.title.toLowerCase()
  var titleB = b.title.toLowerCase()
  var urlA = a.url.toLowerCase()
  var urlB = b.url.toLowerCase()
  
  if(titleA < titleB) return -1
  if(titleA > titleB) return 1

  if(urlA < urlB) return -1
  if(urlA > urlB) return 1

  return 0
}

function sortByTitleAndUrl(arr) {
  return arr.sort(byTitleAndUrl)
}

function readFile(filename) {
  return fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: "utf8" })
}

function appendToFile(filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

function createFile(filename, data) {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

function getBasename(filename) {
  return path.basename(filename, path.extname(filename))
}

function addToCache(url) {
  let id = getUrlPath(url)

  cache[id] = true
}

function checkCache(url) {
  let id = getUrlPath(url)

  return cache.hasOwnProperty(id)
}

function clearCache() {
  cache = {}
}

function getUrlPath(u) {
  let parsed = urlParser.parse(u)
  let searchQuery = parsed.search || ''
  let path = parsed.host + parsed.pathname + searchQuery

  return path.toLowerCase()
}

function validateUrl(channelUrl) {
  const url = new URL(channelUrl)
  const host = url.hostname

  return blacklist.indexOf(host) === -1
}

module.exports = {
  parsePlaylist,
  sortByTitleAndUrl,
  appendToFile,
  createFile,
  readFile,
  loadEPG,
  createChannel,
  getBasename,
  addToCache,
  checkCache,
  clearCache,
  validateUrl
}