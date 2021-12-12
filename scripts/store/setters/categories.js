const categories = require('../../data/categories')

module.exports = function ({ group_title }) {
  return group_title
    .split(';')
    .map(i => categories[i.toLowerCase()])
    .filter(i => i)
}
