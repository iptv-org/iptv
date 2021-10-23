const { orderBy } = require('natural-orderby')
const transliteration = require('transliteration')
const countries = require('../data/countries')
const categories = require('../data/categories')
const languages = require('../data/languages')
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
  const lang = languages.find(l => l.name === name)

  return lang && lang.code ? lang.code : null
}

utils.country2language = function (code) {
  const country = countries[code.toUpperCase()]
  if (!country.languages.length) return ''
  const language = languages.find(l => l.code === country.languages[0])

  return language ? language.name : ''
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
