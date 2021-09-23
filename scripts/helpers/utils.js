const { orderBy } = require('natural-orderby')
const iso6393 = require('@freearhey/iso-639-3')
const transliteration = require('transliteration')
const categories = require('../data/categories')
const regions = require('../data/regions')

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

utils.sortBy = function (arr, fields, order = null) {
  fields = fields.map(field => {
    if (field === 'resolution.height') return channel => channel.resolution.height || 0
    if (field === 'status') return channel => channel.status || ''
    return channel => channel[field]
  })
  return orderBy(arr, fields, order)
}

utils.removeProtocol = function (string) {
  return string.replace(/(^\w+:|^)\/\//, '')
}

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

module.exports = utils
