const ipp = require('iptv-playlist-parser')
const logger = require('./logger')
const file = require('./file')

const parser = {}

parser.parsePlaylist = async function (filepath) {
  const content = await file.read(filepath)
  const playlist = ipp.parse(content)

  return playlist.items
}

parser.parseLogs = async function (filepath) {
  const content = await file.read(filepath)
  if (!content) return []
  const lines = content.split('\n')

  return lines.map(line => (line ? JSON.parse(line) : null)).filter(l => l)
}

parser.parseNumber = function (string) {
  const parsed = parseInt(string)
  if (isNaN(parsed)) {
    throw new Error('scripts/core/parser.js:parseNumber() Input value is not a number')
  }

  return parsed
}

parser.parseChannelName = function (string) {
  return string
    .trim()
    .split(' ')
    .map(s => s.trim())
    .filter(s => {
      return !/\[|\]/i.test(s) && !/\((\d+)P\)/i.test(s)
    })
    .join(' ')
}

parser.parseCountryCode = function (filepath) {
  if (!filepath) return null
  const basename = file.basename(filepath)
  const [code] = basename.split('_') || [null]

  return code
}

module.exports = parser
