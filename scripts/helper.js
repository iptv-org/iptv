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
const intlDisplayNames = new Intl.DisplayNames(['en'], {
  style: 'long',
  type: 'region'
})

let helper = {}

helper.supportedCategories = {
  auto: 'Auto',
  business: 'Business',
  classic: 'Classic',
  comedy: 'Comedy',
  documentary: 'Documentary',
  education: 'Education',
  entertainment: 'Entertainment',
  family: 'Family',
  fashion: 'Fashion',
  food: 'Food',
  general: 'General',
  health: 'Health',
  history: 'History',
  hobby: 'Hobby',
  kids: 'Kids',
  legislative: 'Legislative',
  lifestyle: 'Lifestyle',
  local: 'Local',
  movies: 'Movies',
  music: 'Music',
  news: 'News',
  quiz: 'Quiz',
  religious: 'Religious',
  'sci-fi': 'Sci-Fi',
  shop: 'Shop',
  sport: 'Sport',
  travel: 'Travel',
  weather: 'Weather',
  xxx: 'XXX',
  other: 'Other'
}

helper.code2flag = function (code) {
  switch (code) {
    case 'uk':
      return '🇬🇧'
    case 'int':
      return '🌎'
    case 'unsorted':
      return ''
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
  const playlist = new Playlist(result)
  playlist.url = filename

  return playlist
}

helper.parseEPG = async function (url) {
  return this.getEPG(url).then(content => {
    const result = epgParser.parse(content)
    const channels = {}
    for (let channel of result.channels) {
      channels[channel.id] = channel
    }

    return { url, channels }
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

helper.createChannel = function (data, parent) {
  return new Channel(data, parent)
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
  return this.supportedCategories[groupTitle.toLowerCase()] || ''
}

helper.filterNSFW = function (arr) {
  const sfwCategories = [
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
    'Weather'
  ]

  return arr.filter(i => sfwCategories.includes(i.category))
}

helper.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

helper.code2country = function (code) {
  code = code ? code.toLowerCase() : ''
  if (code === 'int') {
    return { code: 'int', name: 'International' }
  } else if (code === 'unsorted') {
    return null
  }

  return { code, name: intlDisplayNames.of(code.toUpperCase()) }
}

class Playlist {
  constructor(data) {
    this.header = data.header
    this.items = data.items
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
  constructor(data, parent) {
    this.parseData(data, parent)
  }

  parseData(data, parent) {
    this.source = helper.getBasename(parent.url)
    this.logo = data.tvg.logo
    this.category = helper.filterGroup(data.group.title)
    this.url = data.url
    this.name = this.parseName(data.name)
    this.status = this.parseStatus(data.name)
    this.http = data.http
    this.tvg = data.tvg
    this.tvg.url = parent.header.attrs['x-tvg-url'] || ''
    this.countries = this.parseCountries(data.tvg.country)
    this.resolution = this.parseResolution(data.name)
    this.language = this.parseLanguage(data.tvg.language)
  }

  get languageName() {
    return this.language[0] ? this.language[0].name : null
  }

  get countryName() {
    return this.countries[0] ? this.countries[0].name : null
  }

  get countryCode() {
    return this.countries[0] ? this.countries[0].code : null
  }

  parseCountries(value) {
    if (!value) {
      const country = helper.code2country(this.source)
      return country ? [country] : []
    }

    return value
      .split(';')
      .filter(i => i)
      .map(helper.code2country)
  }

  parseName(title) {
    return title
      .trim()
      .split(' ')
      .map(s => s.trim())
      .filter(s => {
        return !/\[|\]/i.test(s) && !/\((\d+)P\)/i.test(s)
      })
      .join(' ')
  }

  parseStatus(title) {
    const regex = /\[(.*)\]/i
    const match = title.match(regex)

    return match ? match[1] : null
  }

  parseResolution(title) {
    const regex = /\((\d+)P\)/i
    const match = title.match(regex)

    return {
      width: null,
      height: match ? parseInt(match[1]) : null
    }
  }

  parseLanguage(lang) {
    return lang
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

  getCountryAttribute() {
    return this.countries.map(c => c.code.toUpperCase()).join(';')
  }

  getLanguageAttribute() {
    return this.language.map(l => l.name).join(';')
  }

  toString() {
    const country = this.getCountryAttribute()
    const language = this.getLanguageAttribute()
    const tvgUrl = (this.tvg.id || this.tvg.name) && this.tvg.url ? this.tvg.url : ''
    const resolution = this.resolution.height ? ` (${this.resolution.height}p)` : ''
    const status = this.status ? ` [${this.status}]` : ''

    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-language="${language}" tvg-logo="${this.logo}" tvg-country="${country}" tvg-url="${tvgUrl}" group-title="${this.category}",${this.name}${resolution}${status}`

    if (this.http['referrer']) {
      info += `\n#EXTVLCOPT:http-referrer=${this.http['referrer']}`
    }

    if (this.http['user-agent']) {
      info += `\n#EXTVLCOPT:http-user-agent=${this.http['user-agent']}`
    }

    return '#EXTINF:' + info + '\n' + this.url + '\n'
  }

  toShortString() {
    const country = this.getCountryAttribute()
    const language = this.getLanguageAttribute()
    const resolution = this.resolution.height ? ` (${this.resolution.height}p)` : ''
    const status = this.status ? ` [${this.status}]` : ''

    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-language="${language}" tvg-logo="${this.logo}" tvg-country="${country}" group-title="${this.category}",${this.name}${resolution}${status}`

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
      countries: this.countries,
      tvg: {
        id: this.tvg.id || null,
        name: this.tvg.name || null,
        url: this.tvg.url || null
      }
    }
  }
}

module.exports = helper
