const statuses = require('../../data/statuses')

module.exports = function ({ title, status = {} }) {
  if (title) {
    const [_, label] = title.match(/\[(.*)\]/i) || [null, null]

    return Object.values(statuses).find(s => s.label === label) || statuses['online']
  }

  if (status) {
    switch (status.code) {
      case 'not_247':
      case 'geo_blocked':
        return status
      case 'offline':
        return statuses['not_247']
      case 'timeout':
        return statuses['timeout']
      default:
        return statuses['online']
    }
  }

  return status
}
