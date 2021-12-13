module.exports = function () {
  if (this.group_title) return this.group_title

  if (Array.isArray(this.categories)) {
    return this.categories
      .map(i => i.name)
      .sort()
      .join(';')
  }

  return ''
}
