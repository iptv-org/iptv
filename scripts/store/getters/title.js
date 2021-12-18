module.exports = function () {
  let title = this.name

  if (this.resolution.height) {
    title += ` (${this.resolution.height}p)`
  }

  if (this.status.label) {
    title += ` [${this.status.label}]`
  }

  return title
}
