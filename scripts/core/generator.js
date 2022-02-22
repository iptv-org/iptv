const { create: createPlaylist } = require('./playlist')
const generators = require('../generators')
const logger = require('./logger')
const file = require('./file')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/generators'

const generator = {}

generator.generate = async function (name, streams = []) {
  if (typeof generators[name] === 'function') {
    try {
      let output = await generators[name].bind()(streams)
      output = Array.isArray(output) ? output : [output]
      for (const type of output) {
        const playlist = createPlaylist(type.items, { public: true })
        await file.create(`${PUBLIC_DIR}/${type.filepath}`, playlist.toString())
      }
      await file.create(`${LOGS_DIR}/${name}.log`, output.map(toJSON).join('\n'))
    } catch (error) {
      logger.error(`generators/${name}.js: ${error.message}`)
    }
  }
}

module.exports = generator

function toJSON(type) {
  type.count = type.items.length
  delete type.items
  return JSON.stringify(type)
}
