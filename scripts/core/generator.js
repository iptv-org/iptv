const file = require('./file')
const generators = require('../generators')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/generators'

const generator = {}

generator.generate = async function (name, items = []) {
  if (typeof generators[name] === 'function') {
    try {
      const logs = await generators[name].bind()(items)
      await file.create(`${LOGS_DIR}/${name}.log`, logs.map(toJSON).join('\n'))
    } catch (error) {
      logger.error(`generators/${name}.js: ${error.message}`)
    }
  }
}

module.exports = generator

function toJSON(item) {
  return JSON.stringify(item)
}
