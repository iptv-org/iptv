const store = require('./store')
const m3u = require('./m3u')
const _ = require('lodash')

const playlist = {}

class Playlist {
  constructor(items = [], options = {}) {
    this.header = {}

    this.links = []
    for (const item of items) {
      const stream = store.create(item)

      let attrs
      if (options.public) {
        attrs = {
          'tvg-id': stream.get('tvg_id'),
          'tvg-logo': stream.get('tvg_logo'),
          'group-title': stream.get('group_title'),
          'user-agent': stream.get('user_agent') || undefined
        }
      } else {
        attrs = {
          'tvg-id': stream.get('tvg_id'),
          'user-agent': stream.get('user_agent') || undefined
        }
      }

      const vlcOpts = {
        'http-referrer': stream.get('http_referrer') || undefined,
        'http-user-agent': stream.get('user_agent') || undefined
      }

      this.links.push({
        url: stream.get('url'),
        title: stream.get('title'),
        attrs,
        vlcOpts
      })
    }
  }

  toString() {
    return m3u.create(this.links, this.header)
  }
}

playlist.create = function (items, options) {
  return new Playlist(items, options)
}

module.exports = playlist
