const categories = require('./categories')
const utils = require('./utils')
const file = require('./file')

const sfwCategories = categories.filter(c => !c.nsfw).map(c => c.name)
const nsfwCategories = categories.filter(c => c.nsfw).map(c => c.name)

module.exports = class Channel {
  constructor(data) {
    this.data = data
    this.raw = data.raw
    this.tvg = data.tvg
    this.http = data.http
    this.url = data.url
    this.logo = data.tvg.logo
    this.group = data.group
    this.name = this.parseName(data.name)
    this.status = this.parseStatus(data.name)
    this.resolution = this.parseResolution(data.name)
    this.category = this.parseCategory(data.group.title)
    this.countries = this.parseCountries(data.tvg.country)
    this.languages = this.parseLanguages(data.tvg.language)
    this.hash = this.generateHash()
  }

  generateHash() {
    return `${this.tvg.id}:${this.tvg.name}:${this.tvg.country}:${this.tvg.language}:${this.logo}:${this.group.title}:${this.name}`.toLowerCase()
  }

  updateUrl(url) {
    this.url = url
    this.data.url = url
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
    const match = title.match(/\[(.*)\]/i)
    return match ? match[1] : null
  }

  parseResolution(title) {
    const match = title.match(/\((\d+)P\)/i)
    const height = match ? parseInt(match[1]) : null

    return { width: null, height }
  }

  parseCategory(string) {
    const category = categories.find(c => c.id === string.toLowerCase())
    if (!category) return ''

    return category.name
  }

  parseCountries(string) {
    const list = string.split(';')
    return list
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
      .map(code => {
        const name = code ? utils.code2name(code) : null
        if (!name) return null

        return { code: code.toLowerCase(), name }
      })
      .filter(c => c)
  }

  parseLanguages(string) {
    const list = string.split(';')
    return list
      .map(name => {
        const code = name ? utils.language2code(name) : null
        if (!code) return null

        return { code, name }
      })
      .filter(l => l)
  }

  isSFW() {
    return sfwCategories.includes(this.category)
  }

  isNSFW() {
    return nsfwCategories.includes(this.category)
  }

  getInfo() {
    let info = `-1 tvg-id="${this.tvg.id}" tvg-name="${this.tvg.name}" tvg-country="${this.tvg.country}" tvg-language="${this.tvg.language}" tvg-logo="${this.logo}"`

    info += ` group-title="${this.group.title}",${this.name}`

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
        id: this.tvg.id || null,
        name: this.tvg.name || null,
        url: this.tvg.url || null
      }
    }
  }
}
