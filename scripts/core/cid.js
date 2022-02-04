const file = require('./file')
const transliteration = require('transliteration')

const cid = {}

cid.generate = function (title, filepath) {
  const name = parseChannelName(title)
  const code = parseCountryCode(filepath)

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

function parseCountryCode(filepath) {
  if (!filepath) return null
  const basename = file.basename(filepath)
  const [code] = basename.split('_') || [null]

  return code
}

function parseChannelName(title) {
  return title
    .trim()
    .split(' ')
    .map(s => s.trim())
    .filter(s => {
      return !/\[|\]/i.test(s) && !/\((\d+)P\)/i.test(s)
    })
    .join(' ')
}
