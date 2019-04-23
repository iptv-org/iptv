const parser = require('url')

function getUrlPath(u) {
  let parsedUrl = parser.parse(u)
  let searchQuery = parsedUrl.search || ''

  return parsedUrl.host + parsedUrl.pathname + searchQuery
}

module.exports = {
  getUrlPath
}
