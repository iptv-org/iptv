const fs = require('fs')
const path = require('path')
const axios = require('axios')
const zlib = require('zlib')
const urlParser = require('url')
const escapeStringRegexp = require('escape-string-regexp')
const markdownInclude = require('markdown-include')
const iso6393 = require('iso-639-3')

let helper = {}

helper.code2flag = function (code) {
  switch (code) {
    case 'uk':
      return '🇬🇧'
    case 'int':
      return '🌎'
    case 'unsorted':
      return ''
    default:
      return code
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))
  }
}

helper.code2name = function (code) {
  const intlDisplayNames = new Intl.DisplayNames(['en'], {
    style: 'long',
    type: 'region'
  })

  try {
    return intlDisplayNames.of(code.toUpperCase())
  } catch (e) {
    return null
  }
}

helper.language2code = function (name) {
  const lang = iso6393.find(l => l.name === name)

  return lang && lang.iso6393 ? lang.iso6393 : null
}

helper.sortBy = function (arr, fields) {
  return arr.sort((a, b) => {
    for (let field of fields) {
      let propA = a[field] ? a[field].toLowerCase() : ''
      let propB = b[field] ? b[field].toLowerCase() : ''

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

helper.loadEPG = function (url) {
  return new Promise((resolve, reject) => {
    var buffer = []
    axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 60000
    })
      .then(res => {
        let stream
        if (/\.gz$/i.test(url)) {
          let gunzip = zlib.createGunzip()
          res.data.pipe(gunzip)
          stream = gunzip
        } else {
          stream = res.data
        }

        stream
          .on('data', function (data) {
            buffer.push(data.toString())
          })
          .on('end', function () {
            resolve(buffer.join(''))
          })
          .on('error', function (e) {
            reject(e)
          })
      })
      .catch(e => {
        reject(e)
      })
  })
}

helper.getBasename = function (filename) {
  return path.basename(filename, path.extname(filename))
}

helper.filterPlaylists = function (arr, include = '', exclude = '') {
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

helper.generateTable = function (data, options) {
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

helper.createDir = function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

helper.readFile = function (filename) {
  return fs.readFileSync(path.resolve(__dirname) + `/../${filename}`, { encoding: 'utf8' })
}

helper.appendToFile = function (filename, data) {
  fs.appendFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.compileMarkdown = function (filepath) {
  return markdownInclude.compileFiles(path.resolve(__dirname, filepath))
}

helper.escapeStringRegexp = function (scring) {
  return escapeStringRegexp(string)
}

helper.createFile = function (filename, data = '') {
  fs.writeFileSync(path.resolve(__dirname) + '/../' + filename, data)
}

helper.writeToLog = function (country, msg, url) {
  var now = new Date()
  var line = `${country}: ${msg} '${url}'`
  this.appendToFile('error.log', now.toISOString() + ' ' + line + '\n')
}

helper.filterNSFW = function (arr) {
  const sfwCategories = [
    'Auto',
    'Business',
    'Classic',
    'Comedy',
    'Documentary',
    'Education',
    'Entertainment',
    'Family',
    'Fashion',
    'Food',
    'General',
    'Health',
    'History',
    'Hobby',
    'Kids',
    'Legislative',
    'Lifestyle',
    'Local',
    'Movies',
    'Music',
    'News',
    'Quiz',
    'Religious',
    'Sci-Fi',
    'Shop',
    'Sport',
    'Travel',
    'Weather'
  ]

  return arr.filter(i => sfwCategories.includes(i.category))
}

helper.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

module.exports = helper
