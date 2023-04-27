const { db, file, parser, store, logger, api } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option('--input-dir <input-dir>', 'Set path to input directory', 'streams')
  .parse(process.argv)
  .opts()

async function main() {
  logger.info('starting...')

  await saveToDatabase(await findStreams())
}

main()

async function findStreams() {
  logger.info(`loading channels...`)
  await api.channels.load()

  logger.info(`looking for streams...`)
  await db.streams.load()

  const streams = []
  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  for (const filepath of files) {
    const playlist = await parser.parsePlaylist(filepath)
    for (const item of playlist.items) {
      item.filepath = filepath

      const stream = store.create()
      const channel = await api.channels.find({ id: item.tvg.id })

      stream.set('channel', { channel: channel ? channel.id : null })
      stream.set('title', { title: item.name })
      stream.set('filepath', { filepath: item.filepath })
      stream.set('url', { url: item.url })
      stream.set('http_referrer', { http_referrer: item.http.referrer })
      stream.set('user_agent', { user_agent: item.http['user-agent'] })

      streams.push(stream)
    }
  }
  logger.info(`found ${streams.length} streams`)

  return streams
}

async function saveToDatabase(streams = []) {
  logger.info('saving to the database...')

  await db.streams.reset()
  for (const stream of streams) {
    await db.streams.insert(stream.data())
  }
}
