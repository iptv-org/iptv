module.exports = function ({ categories }) {
  return Array.isArray(categories) ? categories.filter(c => c.nsfw).length > 0 : false
}
