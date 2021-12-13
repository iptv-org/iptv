const { file } = require('../../core')
const countries = require('../../data/countries')

module.exports = function ({ filepath }) {
  if (filepath) {
    const basename = file.basename(filepath)
    const [_, code] = basename.match(/([a-z]{2})(|_.*)\.m3u/i) || [null, null]

    return code ? countries[code.toUpperCase()] : null
  }

  return null
}
