const store = require('./store')
const _ = require('lodash')

const playlist = {}

class Playlist {
  constructor() {
    this.links = []
  }

  setHeader(attrs = {}) {
    this.header = attrs
  }

  add(url, title, attrs, vlcOpts) {
    this.links.push({ url, title, attrs, vlcOpts })
  }

  toString() {
    let output = `#EXTM3U`
    for (const attr in this.header) {
      const value = this.header[attr]
      output += ` ${attr}="${value}"`
    }
    output += `\n`

    for (const link of this.links) {
      output += `#EXTINF:-1`
      for (const name in link.attrs) {
        const value = link.attrs[name]
        if (value !== undefined) {
          output += ` ${name}="${value}"`
        }
      }
      output += `,${link.title}\n`

      for (const name in link.vlcOpts) {
        const value = link.vlcOpts[name]
        if (value !== undefined) {
          output += `#EXTVLCOPT:${name}=${value}\n`
        }
      }

      output += `${link.url}\n`
    }

    return output
  }
}

playlist.create = function (items = [], options = {}) {
  const p = new Playlist()

  const header = {}
  if (options.public) {
    let guides = items.map(item => item.guides)
    guides = _.uniq(_.flatten(guides)).sort().join(',')

    header['x-tvg-url'] = guides
  }
  p.setHeader(header)

  for (const item of items) {
    const stream = store.create(item)

    let attrs
    if (options.public) {
      attrs = {
        'tvg-id': stream.get('tvg_id'),
        'tvg-country': stream.get('tvg_country'),
        'tvg-language': stream.get('tvg_language'),
        'tvg-logo': stream.get('tvg_logo'),
        'user-agent': stream.get('http.user-agent') || undefined,
        'group-title': stream.get('group_title')
      }
    } else {
      attrs = {
        'tvg-id': stream.get('tvg_id'),
        'user-agent': stream.get('http.user-agent') || undefined
      }
    }

    p.add(stream.get('url'), stream.get('title'), attrs, {
      'http-referrer': stream.get('http.referrer') || undefined,
      'http-user-agent': stream.get('http.user-agent') || undefined
    })
  }

  return p
}

module.exports = playlist
