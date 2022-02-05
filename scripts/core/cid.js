const file = require('./file')
const parser = require('./parser')
const transliteration = require('transliteration')

const cid = {}

cid.generate = function (title, filepath) {
  const name = parser.parseChannelName(title)
  const code = parser.parseCountryCode(filepath)

  if (name && code) {
    const slug = transliteration
      .transliterate(name)
      .replace(/\+/gi, 'Plus')
      .replace(/[^a-z\d]+/gi, '')

    return `${slug}.${code.toLowerCase()}`
  }

  return null
}

module.exports = cid
