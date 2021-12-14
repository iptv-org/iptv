const statuses = require('../../data/statuses')

module.exports = function ({ title, status = {} }) {
  if (title) {
    const [_, label] = title.match(/\[(.*)\]/i) || [null, null]

    return Object.values(statuses).find(s => s.label === label) || statuses['online']
  }

  return status
}
