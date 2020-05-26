const fs = require('fs')
const path = require('path')
const playlistParser = require('iptv-playlist-parser')
const axios = require('axios')
const zlib = require('zlib')
const epgParser = require('epg-parser')
const urlParser = require('url')
const escapeStringRegexp = require('escape-string-regexp')
const markdownInclude = require('markdown-include')
const iso6393 = require('iso-639-3')

let cache = {}
let helper = {}

helper.code2flag = function (code) {
  switch (code) {
    case 'uk':
      return '🇬🇧'
    case 'int':
      return '🌎'
    default:
      return code
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  }
}

helper.sortBy = function (arr, fields) {
  return arr.sort((a, b) => {
    for (let field of fields) {
      let propA = a[field] ? a[field].toLowerCase() : ''
      let propB = b[field] ? b[field].toLowerCase() : ''

      if (propA < propB) {
        return -1
      }
      if (propA > propB) {
        return 1
      }
    }
    return 0
  })
}

helper.createDir = function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

helper.compileMarkdown = function (filepath) {
  return markdownInclude.compileFiles(path.resolve(__dirname, filepath))
}

helper.escapeStringRegexp = function (scring) {
  return escapeStringRegexp(string)
}

helper.getISO6391Name = function (code) {
  const lang = iso6393.find(l => l.iso6393 === code.toLowerCase())

  return lang && lang.name ? lang.name : null
}

helper.getISO6391Code = function (name) {
  const lang = iso6393.find(l => l.name === name)

  return lang && lang.iso6393 ? lang.iso6393 : null
}

helper.parsePlaylist = function (filename) {
  const content = this.readFile(filename)
  const result = playlistParser.parse(content)

  return new Playlist(result)
}

helper.parseEPG = async function (url) {
  const content = await this.getEPG(url)
  const result = epgParser.parse(content)
  const channels = {}
  for (let channel of result.channels) {
    channels[channel.id] = channel
  }

  return Promise.resolve({
    url,
    channels
  })
}

helper.getEPG = function (url) {
  return new Promise((resolve, reject) => {
    var buffer = []
    axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 60000
    })
      .then(res => {
        let stream
        if (/\.gz$/i.test(url)) {
          let gunzip = zlib.createGunzip()
          res.data.pipe(gunzip)
          stream = gunzip
        } else {
          stream = res.data
        }

        stream
          .on('data', function (data) {
            buffer.push(data.toString())
          })
          .on('end', function () {
            resolve(buffer.join(''))
          })
          .on('error', function (e) {
            reject(e)
          })
      })
      .catch(e => {
        reject(e)
      })
  })
}

helper.readFile = function (filename) {
  return fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: 'utf8' })
}

helper.appendToFile = function (filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.createFile = function (filename, data = '') {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.getBasename = function (filename) {
  return path.basename(filename, path.extname(filename))
}

helper.getUrlPath = function (u) {
  let parsed = urlParser.parse(u)
  let searchQuery = parsed.search || ''
  let path = parsed.host + parsed.pathname + searchQuery

  return path.toLowerCase()
}

helper.generateTable = function (data, options) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of options.columns) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let item of data) {
    output += '\t\t<tr>'
    let i = 0
    for (let prop in item) {
      const column = options.columns[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

helper.createChannel = function (data) {
  return new Channel(data)
}

helper.writeToLog = function (country, msg, url) {
  var now = new Date()
  var line = `${country}: ${msg} '${url}'`
  this.appendToFile('error.log', now.toISOString() + ' ' + line + '\n')
}

helper.filterPlaylists = function (arr, include = '', exclude = '') {
  if (include) {
    const included = include.split(',').map(filename => `channels/${filename}.m3u`)

    return arr.filter(i => included.indexOf(i.url) > -1)
  }

  if (exclude) {
    const excluded = exclude.split(',').map(filename => `channels/${filename}.m3u`)

    return arr.filter(i => excluded.indexOf(i.url) === -1)
  }

  return arr
}

helper.filterGroup = function (groupTitle) {
  if (!groupTitle) return ''

  const supportedCategories = [
    'Auto',
    'Business',
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
    'Religious',
    'Sci-Fi',
    'Shop',
    'Sport',
    'Travel',
    'Weather',
    'XXX'
  ]
  const groupIndex = supportedCategories.map(g => g.toLowerCase()).indexOf(groupTitle.toLowerCase())

  if (groupIndex === -1) {
    groupTitle = ''
  } else {
    groupTitle = supportedCategories[groupIndex]
  }

  return groupTitle
}

class Playlist {
  constructor(data) {
    this.header = data.header
    this.items = data.items
    this.changed = false
  }

  getHeader() {
    let parts = ['#EXTM3U']
    for (let key in this.header.attrs) {
      let value = this.header.attrs[key]
      if (value) {
        parts.push(`${key}="${value}"`)
      }
    }

    return `${parts.join(' ')}\n`
  }
}

class Channel {
  constructor(data) {
    this.parseData(data)
  }

  parseData(data) {
    this.logo = data.tvg.logo
    this.category = helper.filterGroup(data.group.title)
    this.url = data.url
    this.name = data.name.trim()
    this.http = data.http
    this.tvg = data.tvg
    this.country = {
      code: null,
      name: null
    }

    this.setLanguage(data.tvg.language)
  }

  get ['language.name']() {
    return this.language[0] ? this.language[0].name : null
  }

  get ['country.name']() {
    return this.country.name || null
  }

  setLanguage(lang) {
    this.language = lang
      .split(';')
      .map(name => {
        const code = name ? helper.getISO6391Code(name) : null
        if (!code) return null

        return {
          code,
          name
        }
      })
      .filter(l => l)
  }

  toString() {
    const country = this.country.code ? this.country.code.toUpperCase() : ''
    const tvgUrl = (this.tvg.id || this.tvg.name) && this.tvg.url ? this.tvg.url : ''
    const language = this.language.map(l => l.name).join(';')

    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-language="${language}" tvg-logo="${this.logo}" tvg-country="${country}" tvg-url="${tvgUrl}" group-title="${this.category}",${this.name}`

    if (this.http['referrer']) {
      info += `\n#EXTVLCOPT:http-referrer=${this.http['referrer']}`
    }

    if (this.http['user-agent']) {
      info += `\n#EXTVLCOPT:http-user-agent=${this.http['user-agent']}`
    }

    return '#EXTINF:' + info + '\n' + this.url + '\n'
  }

  toShortString() {
    const language = this.language.map(l => l.name).join(';')

    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-language="${language}" tvg-logo="${this.logo}" group-title="${this.category}",${this.name}`

    if (this.http['referrer']) {
      info += `\n#EXTVLCOPT:http-referrer=${this.http['referrer']}`
    }

    if (this.http['user-agent']) {
      info += `\n#EXTVLCOPT:http-user-agent=${this.http['user-agent']}`
    }

    return '#EXTINF:' + info + '\n' + this.url + '\n'
  }

  toJSON() {
    return {
      name: this.name,
      logo: this.logo || null,
      url: this.url,
      category: this.category || null,
      language: this.language,
      country: this.country,
      tvg: {
        id: this.tvg.id || null,
        name: this.tvg.name || null,
        url: this.tvg.url || null
      }
    }
  }
}

module.exports = helper
