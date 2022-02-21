const normalize = require('normalize-url')

module.exports = function ({ url }) {
  const normalized = normalize(url, { stripWWW: false })

  return decodeURIComponent(normalized).replace(/\s/g, '+')
}
