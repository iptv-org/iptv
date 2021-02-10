const categories = require('./categories')
const parser = require('./parser')
const utils = require('./utils')

const db = {}

db.load = function () {
  const items = parser.parseIndex()
  for (const item of items) {
    const playlist = parser.parsePlaylist(item.url)
    for (const channel of playlist.channels) {
      db.channels.add(channel)

      for (const country of channel.countries) {
        if (!db.countries.has(country)) {
          db.countries.add(country)
        }
      }

      for (const language of channel.languages) {
        if (!db.languages.has(language)) {
          db.languages.add(language)
        }
      }
    }
  }
}

db.channels = {
  list: [],
  add(channel) {
    this.list.push(channel)
  },
  all() {
    return this.list
  },
  forCountry(country) {
    if (!country.code) return this.list.filter(channel => !channel.countries.length)

    return this.list.filter(channel => channel.countries.map(c => c.code).includes(country.code))
  },
  forLanguage(language) {
    if (!language.code) return this.list.filter(channel => !channel.languages.length)

    return this.list.filter(channel => channel.languages.map(c => c.code).includes(language.code))
  },
  forCategory(category) {
    if (!category.id) return this.list.filter(channel => !channel.category)

    return this.list.filter(channel => channel.category.toLowerCase() === category.id)
  },
  count() {
    return this.list.length
  },
  sortBy(fields) {
    this.list = utils.sortBy(this.list, fields)

    return this
  }
}

db.countries = {
  list: [],
  has(country) {
    return this.list.map(c => c.code).includes(country.code)
  },
  add(country) {
    this.list.push(country)
  },
  all() {
    return this.list
  },
  count() {
    return this.list.length
  },
  sortBy(fields) {
    this.list = utils.sortBy(this.list, fields)

    return this
  }
}

db.languages = {
  list: [],
  has(language) {
    return this.list.map(c => c.code).includes(language.code)
  },
  add(language) {
    this.list.push(language)
  },
  all() {
    return this.list
  },
  count() {
    return this.list.length
  },
  sortBy(fields) {
    this.list = utils.sortBy(this.list, fields)

    return this
  }
}

db.categories = {
  list: categories,
  all() {
    return this.list
  },
  count() {
    return this.list.length
  }
}

module.exports = db
