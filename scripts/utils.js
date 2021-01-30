const fs = require('fs')
const path = require('path')
const axios = require('axios')
const zlib = require('zlib')
const urlParser = require('url')
const escapeStringRegexp = require('escape-string-regexp')
const markdownInclude = require('markdown-include')
const iso6393 = require('iso-639-3')
const intlDisplayNames = new Intl.DisplayNames(['en'], {
  style: 'narrow',
  type: 'region'
})

const utils = {}

utils.supportedCategories = [
  {
    name: 'Auto',
    id: 'auto',
    nsfw: false
  },
  {
    name: 'Business',
    id: 'business',
    nsfw: false
  },
  {
    name: 'Classic',
    id: 'classic',
    nsfw: false
  },
  {
    name: 'Comedy',
    id: 'comedy',
    nsfw: false
  },
  {
    name: 'Documentary',
    id: 'documentary',
    nsfw: false
  },
  {
    name: 'Education',
    id: 'education',
    nsfw: false
  },
  {
    name: 'Entertainment',
    id: 'entertainment',
    nsfw: false
  },
  {
    name: 'Family',
    id: 'family',
    nsfw: false
  },
  {
    name: 'Fashion',
    id: 'fashion',
    nsfw: false
  },
  {
    name: 'Food',
    id: 'food',
    nsfw: false
  },
  {
    name: 'General',
    id: 'general',
    nsfw: false
  },
  {
    name: 'Health',
    id: 'health',
    nsfw: false
  },
  {
    name: 'History',
    id: 'history',
    nsfw: false
  },
  {
    name: 'Hobby',
    id: 'hobby',
    nsfw: false
  },
  {
    name: 'Kids',
    id: 'kids',
    nsfw: false
  },
  {
    name: 'Legislative',
    id: 'legislative',
    nsfw: false
  },
  {
    name: 'Lifestyle',
    id: 'lifestyle',
    nsfw: false
  },
  {
    name: 'Local',
    id: 'local',
    nsfw: false
  },
  {
    name: 'Movies',
    id: 'movies',
    nsfw: false
  },
  {
    name: 'Music',
    id: 'music',
    nsfw: false
  },
  {
    name: 'News',
    id: 'news',
    nsfw: false
  },
  {
    name: 'Quiz',
    id: 'quiz',
    nsfw: false
  },
  {
    name: 'Religious',
    id: 'religious',
    nsfw: false
  },
  {
    name: 'Sci-Fi',
    id: 'sci-fi',
    nsfw: false
  },
  {
    name: 'Shop',
    id: 'shop',
    nsfw: false
  },
  {
    name: 'Sport',
    id: 'sport',
    nsfw: false
  },
  {
    name: 'Travel',
    id: 'travel',
    nsfw: false
  },
  {
    name: 'Weather',
    id: 'weather',
    nsfw: false
  },
  {
    name: 'XXX',
    id: 'xxx',
    nsfw: true
  }
]

utils.code2flag = function (code) {
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

utils.code2name = function (code) {
  switch (code.toLowerCase()) {
    case 'int':
      return 'International'
    case 'us':
      return 'United States'
  }

  try {
    return intlDisplayNames.of(code.toUpperCase())
  } catch (e) {
    return null
  }
}

utils.codeIsValid = function (code) {
  switch (code.toLowerCase()) {
    case 'int':
      return true
    case 'us':
      return true
  }

  try {
    intlDisplayNames.of(code.toUpperCase())

    return true
  } catch (e) {
    return false
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

utils.loadEPG = function (url) {
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

utils.filterNSFW = function (arr) {
  const sfwCategories = utils.supportedCategories.filter(c => !c.nsfw).map(c => c.name)

  return arr.filter(i => sfwCategories.includes(i.category))
}

utils.sleep = function (ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

module.exports = utils
