const { createLogger, format, transports, addColors } = require('winston')
const { combine, timestamp, printf } = format

const consoleFormat = ({ level, message, timestamp }) => {
  if (typeof message === 'object') return JSON.stringify(message)
  return message
}

const config = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    failed: 3,
    success: 4,
    http: 5,
    verbose: 6,
    debug: 7,
    silly: 8
  },
  colors: {
    info: 'white',
    success: 'green',
    failed: 'red'
  }
}

const t = [
  new transports.Console({
    format: format.combine(format.printf(consoleFormat))
  })
]

const logger = createLogger({
  transports: t,
  levels: config.levels,
  level: 'verbose'
})

addColors(config.colors)

module.exports = logger
