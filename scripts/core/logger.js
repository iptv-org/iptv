const { Signale } = require('signale')

const options = {}

const logger = new Signale(options)

logger.config({
  displayLabel: false,
  displayScope: false,
  displayBadge: false
})

module.exports = logger
