module.exports = function () {
  if (this.group_title) return this.group_title

  if (this.categories.length) {
    return this.categories
      .filter(c => c)
      .map(category => category.name)
      .sort()
      .join(';')
  }

  return 'Undefined'
}
