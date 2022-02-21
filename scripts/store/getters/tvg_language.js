module.exports = function () {
  if (this.tvg_language) return this.tvg_language

  if (this.languages.length) {
    return this.languages
      .map(language => (language ? language.name : null))
      .filter(l => l)
      .sort()
      .join(';')
  }

  return ''
}
