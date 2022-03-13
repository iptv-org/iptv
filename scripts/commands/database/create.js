const { db, file, parser, store, logger, id, api } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    256
  )
  .option('--input-dir <input-dir>', 'Set path to input directory', 'streams')
  .parse(process.argv)
  .opts()

async function main() {
  logger.info('starting...')
  logger.info(`number of clusters: ${options.maxClusters}`)

  await saveToDatabase(await findStreams())

  logger.info('done')
}

main()

async function findStreams() {
  logger.info(`looking for streams...`)

  await api.channels.load()
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
  const chunks = split(_.shuffle(streams), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const stream of chunk) {
      stream.set('cluster_id', { cluster_id: i + 1 })

      await db.streams.insert(stream.data())
    }
  }
}

function split(arr, n) {
  let result = []
  for (let i = n; i > 0; i--) {
    result.push(arr.splice(0, Math.ceil(arr.length / i)))
  }
  return result
}
