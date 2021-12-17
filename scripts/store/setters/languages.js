const langs = require('../../data/languages')

module.exports = function ({ tvg_language, languages = [] }) {
  if (tvg_language) {
    return tvg_language
      .split(';')
      .map(name => langs.find(l => l.name === name))
      .filter(i => i)
  }

  return languages
}
