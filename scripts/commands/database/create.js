const { db, file, parser, store, logger } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option('--input-dir <input-dir>', 'Set path to input directory', 'streams')
  .parse(process.argv)
  .opts()

async function main() {
  logger.info(`looking for streams...`)
  const streams = []
  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  for (const filepath of files) {
    const playlist = await parser.parsePlaylist(filepath)
    for (const item of playlist.items) {
      item.filepath = filepath

      const stream = store.create()

      stream.set('channel', item.tvg.id)
      stream.set('title', item.name)
      stream.set('filepath', item.filepath)
      stream.set('url', item.url)
      stream.set('http_referrer', item.http.referrer)
      stream.set('user_agent', item.http['user-agent'])

      streams.push(stream)
    }
  }
  logger.info(`found ${streams.length} streams`)

  logger.info('saving to the database...')
  await db.streams.load()
  await db.streams.reset()
  const data = streams.map(stream => stream.data())
  await db.streams.insert(data)
}

main()
