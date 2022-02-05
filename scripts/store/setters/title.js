const { parser } = require('../../core')

module.exports = function ({ title }) {
  return parser.parseChannelName(title)
}
