const playlistParser = require('iptv-playlist-parser')
const epgParser = require('epg-parser')
const utils = require('./utils')
const supportedCategories = {
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

const parser = {}

parser.parseIndex = function () {
  const content = utils.readFile('index.m3u')
  const result = playlistParser.parse(content)

  return result.items
}

parser.parsePlaylist = function (filename) {
  const content = utils.readFile(filename)
  const result = playlistParser.parse(content)

  return new Playlist({ header: result.header, items: result.items, url: filename })
}

parser.parseCountries = function (string) {
  return string
    .split(';')
    .filter(i => i)
    .map(code => {
      code = code ? code.toLowerCase() : ''
      if (code === 'int') {
        return { code: 'int', name: 'International' }
      } else if (code === 'unsorted') {
        return null
      }

      return { code, name: utils.code2name(code) }
    })
}

parser.parseLanguages = function (string) {
  return string
    .split(';')
    .map(name => {
      const code = name ? utils.language2code(name) : null
      if (!code) return null

      return {
        code,
        name
      }
    })
    .filter(l => l)
}

parser.parseCategory = function (string) {
  return supportedCategories[string.toLowerCase()] || ''
}

parser.parseTitle = function (title) {
  const channelName = title
    .trim()
    .split(' ')
    .map(s => s.trim())
    .filter(s => {
      return !/\[|\]/i.test(s) && !/\((\d+)P\)/i.test(s)
    })
    .join(' ')

  const streamStatusMatch = title.match(/\[(.*)\]/i)
  const streamStatus = streamStatusMatch ? streamStatusMatch[1] : null

  const streamResolutionMatch = title.match(/\((\d+)P\)/i)
  const streamResolutionHeight = streamResolutionMatch ? parseInt(streamResolutionMatch[1]) : null
  const streamResolution = { width: null, height: streamResolutionHeight }

  return { channelName, streamStatus, streamResolution }
}

parser.parseEPG = async function (url) {
  return utils.loadEPG(url).then(content => {
    const result = epgParser.parse(content)
    const channels = {}
    for (let channel of result.channels) {
      channels[channel.id] = channel
    }

    return { url, channels }
  })
}

class Playlist {
  constructor({ header, items, url }) {
    this.url = url
    this.header = header
    this.channels = items
      .map(item => new Channel({ data: item, header, sourceUrl: url }))
      .filter(channel => channel.url)
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
  constructor({ data, header, sourceUrl }) {
    this.parseData(data)

    if (!this.countries.length) {
      const filename = utils.getBasename(sourceUrl)
      const countryName = utils.code2name(filename)
      this.countries = countryName ? [{ code: filename.toLowerCase(), name: countryName }] : []
    }

    this.tvg.url = header.attrs['x-tvg-url'] || ''
  }

  parseData(data) {
    const title = parser.parseTitle(data.name)

    this.tvg = data.tvg
    this.http = data.http
    this.url = data.url
    this.logo = data.tvg.logo
    this.name = title.channelName
    this.status = title.streamStatus
    this.resolution = title.streamResolution
    this.countries = parser.parseCountries(data.tvg.country)
    this.languages = parser.parseLanguages(data.tvg.language)
    this.category = parser.parseCategory(data.group.title)
  }

  get tvgCountry() {
    return this.countries.map(c => c.code.toUpperCase()).join(';')
  }

  get tvgLanguage() {
    return this.languages.map(l => l.name).join(';')
  }

  get tvgUrl() {
    return (this.tvg.id || this.tvg.name) && this.tvg.url ? this.tvg.url : ''
  }

  toString(short = false) {
    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-language="${this.tvgLanguage}" tvg-logo="${this.logo}" tvg-country="${this.tvgCountry}"`

    if (!short) {
      info += ` tvg-url="${this.tvgUrl}"`
    }

    info += ` group-title="${this.category}",${this.name}`

    if (this.resolution.height) {
      info += ` (${this.resolution.height}p)`
    }

    if (this.status) {
      info += ` [${this.status}]`
    }

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
      languages: this.languages,
      countries: this.countries,
      tvg: {
        id: this.tvg.id || null,
        name: this.tvg.name || null,
        url: this.tvg.url || null
      }
    }
  }
}

module.exports = parser
