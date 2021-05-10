const fs = require('fs')
const path = require('path')
const axios = require('axios')
const zlib = require('zlib')
const urlParser = require('url')
const escapeStringRegexp = require('escape-string-regexp')
const markdownInclude = require('markdown-include')
const iso6393 = require('iso-639-3')
const transliteration = require('transliteration')
const regions = require('./regions')
const categories = require('./categories')
const intlDisplayNames = new Intl.DisplayNames(['en'], {
  style: 'narrow',
  type: 'region'
})

const utils = {}

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

  return lang && lang.iso6393 ? lang.iso6393 : null
}

utils.sortBy = function (arr, fields) {
  return arr.sort((a, b) => {
    for (let field of fields) {
      let propA = a[field] ? a[field].toLowerCase() : ''
      let propB = b[field] ? b[field].toLowerCase() : ''

      if (propA === 'undefined') {
        return 1
      }

      if (propB === 'undefined') {
        return -1
      }

      if (propA === 'other') {
        return 1
      }

      if (propB === 'other') {
        return -1
      }

      if (propA < propB) {
        return -1
      }
      if (propA > propB) {
        return 1
      }
    }
    return 0
  })
}

utils.getBasename = function (filename) {
  return path.basename(filename, path.extname(filename))
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

utils.generateTable = function (data, options) {
  let output = '<table>\n'

  output += '\t<thead>\n\t\t<tr>'
  for (let column of options.columns) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr>\n\t</thead>\n'

  output += '\t<tbody>\n'
  for (let item of data) {
    output += '\t\t<tr>'
    let i = 0
    for (let prop in item) {
      const column = options.columns[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '\t</tbody>\n'

  output += '</table>'

  return output
}

utils.createDir = function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

utils.readFile = function (filename) {
  return fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: 'utf8' })
}

utils.appendToFile = function (filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

utils.compileMarkdown = function (filepath) {
  return markdownInclude.compileFiles(path.resolve(__dirname, filepath))
}

utils.escapeStringRegexp = function (scring) {
  return escapeStringRegexp(string)
}

utils.createFile = function (filename, data = '') {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

utils.writeToLog = function (country, msg, url) {
  var now = new Date()
  var line = `${country}: ${msg} '${url}'`
  this.appendToFile('error.log', now.toISOString() + ' ' + line + '\n')
}

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

utils.removeProtocol = function (string) {
  return string.replace(/(^\w+:|^)\/\//, '')
}

module.exports = utils
