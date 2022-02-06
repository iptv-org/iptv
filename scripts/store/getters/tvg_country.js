module.exports = function () {
  return Array.isArray(this.broadcast_area) ? this.broadcast_area.join(';') : ''
}
