const categories = require('./categories')
const utils = require('./utils')
const file = require('./file')

const sfwCategories = categories.filter(c => !c.nsfw).map(c => c.name)
const nsfwCategories = categories.filter(c => c.nsfw).map(c => c.name)

module.exports = class Channel {
  constructor({ data, header, sourceUrl }) {
    this.parseData(data)

    this.filename = file.getBasename(sourceUrl)
    if (!this.countries.length) {
      const countryName = utils.code2name(this.filename)
      this.countries = countryName ? [{ code: this.filename, name: countryName }] : []
      this.tvg.country = this.countries.map(c => c.code.toUpperCase()).join(';')
    }
  }

  parseData(data) {
    const title = this.parseTitle(data.name)

    this.tvg = data.tvg
    this.http = data.http
    this.url = data.url
    this.logo = data.tvg.logo
    this.name = title.channelName
    this.status = title.streamStatus
    this.resolution = title.streamResolution
    this.countries = this.parseCountries(data.tvg.country)
    this.languages = this.parseLanguages(data.tvg.language)
    this.category = this.parseCategory(data.group.title)
    this.raw = data.raw
  }

  parseCountries(string) {
    let arr = string
      .split(';')
      .reduce((acc, curr) => {
        const codes = utils.region2codes(curr)
        if (codes.length) {
          for (let code of codes) {
            if (!acc.includes(code)) {
              acc.push(code)
            }
          }
        } else {
          acc.push(curr)
        }

        return acc
      }, [])
      .filter(code => code && utils.code2name(code))

    return arr.map(code => {
      return { code: code.toLowerCase(), name: utils.code2name(code) }
    })
  }

  parseLanguages(string) {
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

  parseCategory(string) {
    const category = categories.find(c => c.id === string.toLowerCase())

    return category ? category.name : ''
  }

  parseTitle(title) {
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

  get tvgCountry() {
    return this.tvg.country
      .split(';')
      .map(code => utils.code2name(code))
      .join(';')
  }

  get tvgLanguage() {
    return this.tvg.language
  }

  get tvgUrl() {
    return this.tvg.id && this.tvg.url ? this.tvg.url : ''
  }

  get tvgId() {
    if (this.tvg.id) {
      return this.tvg.id
    } else if (this.filename !== 'unsorted') {
      const id = utils.name2id(this.tvgName)

      return id ? `${id}.${this.filename}` : ''
    }

    return ''
  }

  get tvgName() {
    if (this.tvg.name) {
      return this.tvg.name
    } else if (this.filename !== 'unsorted') {
      return this.name.replace(/\"/gi, '')
    }

    return ''
  }

  getInfo() {
    this.tvg.country = this.tvg.country.toUpperCase()

    let info = `-1 tvg-id="${this.tvgId}" tvg-name="${this.tvgName}" tvg-country="${this.tvg.country}" tvg-language="${this.tvg.language}" tvg-logo="${this.logo}"`

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

    return info
  }

  toString(raw = false) {
    if (raw) return this.raw + '\n'

    return '#EXTINF:' + this.getInfo() + '\n' + this.url + '\n'
  }

  toObject() {
    return {
      name: this.name,
      logo: this.logo || null,
      url: this.url,
      category: this.category || null,
      languages: this.languages,
      countries: this.countries,
      tvg: {
        id: this.tvgId || null,
        name: this.tvgName || null,
        url: this.tvgUrl || null
      }
    }
  }

  isSFW() {
    return sfwCategories.includes(this.category)
  }

  isNSFW() {
    return nsfwCategories.includes(this.category)
  }
}
