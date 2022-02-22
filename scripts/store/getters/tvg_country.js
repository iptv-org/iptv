module.exports = function () {
  if (this.tvg_country) return this.tvg_country

  if (this.broadcast_area.length) {
    return this.broadcast_area
      .map(item => {
        const [_, code] = item.split('/')
        return code
      })
      .filter(i => i)
      .sort()
      .join(';')
  }

  return ''
}
