const Channel = require('./Channel')
const file = require('./file')

module.exports = class Playlist {
  constructor({ header, items, url, name, country }) {
    this.url = url
    this.name = name
    this.country = country
    this.header = header
    this.channels = items.map(item => new Channel(item)).filter(channel => channel.url)
    this.updated = false
  }

  toString(options = {}) {
    const config = { raw: false, ...options }
    let parts = ['#EXTM3U']
    for (let key in this.header.attrs) {
      let value = this.header.attrs[key]
      if (value) {
        parts.push(`${key}="${value}"`)
      }
    }

    let output = `${parts.join(' ')}\n`
    for (let channel of this.channels) {
      output += channel.toString(config.raw)
    }

    return output
  }

  save() {
    if (this.updated) {
      file.create(this.url, this.toString())
    }
  }
}
