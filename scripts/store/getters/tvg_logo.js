module.exports = function () {
  if (this.tvg_logo) return this.tvg_logo

  return this.logo || ''
}
