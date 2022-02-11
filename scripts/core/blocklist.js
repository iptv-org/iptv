const list = require('../data/blocklist')
const parser = require('./parser')

const blocklist = {}

blocklist.find = function (title, country) {
  const name = parser.parseChannelName(title)

  return list.find(item => {
    const regexp = new RegExp(item.regex, 'i')
    const hasSameName = regexp.test(name)
    const fromSameCountry = country === item.country

    return hasSameName && fromSameCountry
  })
}

module.exports = blocklist
