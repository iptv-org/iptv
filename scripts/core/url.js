const normalize = require('normalize-url')

const url = {}

url.normalize = function (string) {
  const normalized = normalize(string, { stripWWW: false })

  return decodeURIComponent(normalized).replace(/\s/g, '+')
}

module.exports = url
