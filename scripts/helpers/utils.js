const transliteration = require('transliteration')
const iso6393 = require('@freearhey/iso-639-3')
const categories = require('./categories')
const regions = require('./regions')

const utils = {}
const intlDisplayNames = new Intl.DisplayNames(['en'], {
  style: 'narrow',
  type: 'region'
})

utils.name2id = function (name) {
  return transliteration
    .transliterate(name)
    .replace(/\+/gi, 'Plus')
    .replace(/[^a-z\d]+/gi, '')
}

utils.code2flag = function (code) {
  code = code.toUpperCase()
  switch (code) {
    case 'UK':
      return '🇬🇧'
    case 'INT':
      return '🌍'
    case 'UNDEFINED':
      return ''
    default:
      return code.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  }
}

utils.region2codes = function (region) {
  region = region.toUpperCase()

  return regions[region] ? regions[region].codes : []
}

utils.code2name = function (code) {
  try {
    code = code.toUpperCase()
    if (regions[code]) return regions[code].name
    if (code === 'US') return 'United States'
    if (code === 'INT') return 'International'
    return intlDisplayNames.of(code)
  } catch (e) {
    return null
  }
}

utils.language2code = function (name) {
  const lang = iso6393.find(l => l.name === name)

  return lang && lang.code ? lang.code : null
}

utils.sortBy = function (arr, fields) {
  return arr.sort((a, b) => {
    for (let field of fields) {
      let propA = a[field] ? a[field].toLowerCase() : ''
      let propB = b[field] ? b[field].toLowerCase() : ''
      if (propA === 'undefined') return 1
      if (propB === 'undefined') return -1
      if (propA === 'other') return 1
      if (propB === 'other') return -1
      if (propA < propB) return -1
      if (propA > propB) return 1
    }
    return 0
  })
}

utils.removeProtocol = function (string) {
  return string.replace(/(^\w+:|^)\/\//, '')
}

utils.filterPlaylists = function (arr, include = '', exclude = '') {
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

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

module.exports = utils
