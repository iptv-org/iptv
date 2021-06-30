const categories = require('./categories')
const parser = require('./parser')
const utils = require('./utils')

const sfwCategories = categories.filter(c => !c.nsfw).map(c => c.name)

const db = {}

db.load = function () {
  const items = parser.parseIndex()
  for (const item of items) {
    const playlist = parser.parsePlaylist(item.url)
    db.playlists.add(playlist)
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
  filter: null,
  duplicates: true,
  nsfw: true,
  add(channel) {
    this.list.push(channel)
  },
  get() {
    let output
    if (this.filter) {
      switch (this.filter.field) {
        case 'countries':
          if (this.filter.value === 'undefined') {
            output = this.list.filter(channel => !channel.countries.length)
          } else {
            output = this.list.filter(channel =>
              channel.countries.map(c => c.code).includes(this.filter.value)
            )
          }
          break
        case 'languages':
          if (this.filter.value === 'undefined') {
            output = this.list.filter(channel => !channel.languages.length)
          } else {
            output = this.list.filter(channel =>
              channel.languages.map(c => c.code).includes(this.filter.value)
            )
          }
          break
        case 'category':
          if (this.filter.value === 'other') {
            output = this.list.filter(channel => !channel.category)
          } else {
            output = this.list.filter(
              channel => channel.category.toLowerCase() === this.filter.value
            )
          }
          break
      }
    } else {
      output = this.list
    }

    if (!this.duplicates) {
      const buffer = []
      output = output.filter(channel => {
        const info = channel.getInfo()
        if (buffer.includes(info)) return false
        buffer.push(info)

        return true
      })
    }

    if (!this.nsfw) {
      output = output.filter(channel => !channel.isNSFW())
    }

    this.nsfw = true
    this.duplicates = true
    this.filter = null

    return output
  },
  removeDuplicates() {
    this.duplicates = false

    return this
  },
  removeNSFW() {
    this.nsfw = false

    return this
  },
  all() {
    return this.list
  },
  sfw() {
    return this.list.filter(i => sfwCategories.includes(i.category))
  },
  forCountry(country) {
    this.filter = {
      field: 'countries',
      value: country.code
    }

    return this
  },
  forLanguage(language) {
    this.filter = {
      field: 'languages',
      value: language.code
    }

    return this
  },
  forCategory(category) {
    this.filter = {
      field: 'category',
      value: category.id
    }

    return this
  },
  count() {
    return this.get().length
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

db.playlists = {
  list: [],
  add(playlist) {
    this.list.push(playlist)
  },
  all() {
    return this.list
  },
  only(list = []) {
    return this.list.filter(playlist => list.includes(playlist.name))
  },
  except(list = []) {
    return this.list.filter(playlist => !list.includes(playlist.name))
  },
  sortBy(fields) {
    this.list = utils.sortBy(this.list, fields)

    return this
  },
  count() {
    return this.list.length
  }
}

module.exports = db
