const { transliterate } = require('transliteration')

const id = {}

id.generate = function (name, code) {
  if (!name || !code) return null

  name = name.replace(/ *\([^)]*\) */g, '')
  name = name.replace(/ *\[[^)]*\] */g, '')
  name = name.replace(/\+/gi, 'Plus')
  name = name.replace(/[^a-z\d]+/gi, '')
  name = name.trim()
  name = transliterate(name)
  code = code.toLowerCase()

  return `${name}.${code}`
}

module.exports = id
