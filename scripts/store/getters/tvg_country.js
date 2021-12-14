module.exports = function () {
  if (this.tvg_country) return this.tvg_country

  return Array.isArray(this.countries) ? this.countries.map(i => i.code).join(';') : ''
}
