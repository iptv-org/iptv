const { create: createPlaylist } = require('./playlist')
const logger = require('./logger')
const file = require('./file')
const generators = require('../generators')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'
const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/generators'

const generator = {}

generator.generate = async function (name, items = []) {
  if (typeof generators[name] === 'function') {
    try {
      const output = await generators[name].bind()(items)
      await file.create(`${LOGS_DIR}/${name}.log`, output.map(toJSON).join('\n'))
      for (const type of output) {
        const playlist = createPlaylist(type.items, { public: true })
        await file.create(`${PUBLIC_DIR}/${name}/${type.id}.m3u`, playlist.toString())
      }
    } catch (error) {
      logger.error(`generators/${name}.js: ${error.message}`)
    }
  }
}

module.exports = generator

function toJSON(type) {
  return JSON.stringify({ id: type.id, count: type.items.length })
}
