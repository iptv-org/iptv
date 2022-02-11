const { db, file, parser, store, logger, id } = require('../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    256
  )
  .option('--input-dir <input-dir>', 'Set path to input directory', 'channels')
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

  await db.streams.load()
  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  const streams = []
  for (const filepath of files) {
    const items = await parser.parsePlaylist(filepath)
    for (const item of items) {
      item.filepath = filepath
      streams.push(item)
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
    for (const item of chunk) {
      const stream = store.create()
      stream.set('channel_id', { channel_id: item.tvg.id })
      stream.set('channel_name', { title: item.name })
      stream.set('filepath', { filepath: item.filepath })
      stream.set('resolution', { title: item.name })
      stream.set('status', { title: item.name })
      stream.set('url', { url: item.url })
      stream.set('http', { http: item.http })
      stream.set('is_broken', { status: stream.get('status') })
      stream.set('updated', { updated: false })
      stream.set('cluster_id', { cluster_id: i + 1 })

      if (!stream.get('channel_id')) {
        const channel_id = id.generate(item.name, item.filepath)

        stream.set('channel_id', { channel_id })
        stream.set('updated', { updated: true })
      }

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
