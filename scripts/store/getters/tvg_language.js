module.exports = function () {
  return Array.isArray(this.languages) ? this.languages.map(i => i.name).join(';') : ''
}
