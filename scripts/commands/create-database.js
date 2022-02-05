const { db, file, parser, store, logger, cid } = require('../core')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    200
  )
  .option('--input-dir <input-dir>', 'Set path to input directory', 'channels')
  .parse(process.argv)
  .opts()

const links = []

async function main() {
  logger.info('starting...')
  logger.info(`number of clusters: ${options.maxClusters}`)

  await loadChannels()
  await saveToDatabase()

  logger.info('done')
}

main()

async function loadChannels() {
  logger.info(`loading links...`)

  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  for (const filepath of files) {
    const items = await parser.parsePlaylist(filepath)
    for (const item of items) {
      item.filepath = filepath
      links.push(item)
    }
  }
  logger.info(`found ${links.length} links`)
}

async function saveToDatabase() {
  logger.info('saving to the database...')

  await db.reset()
  const chunks = split(_.shuffle(links), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const item of chunk) {
      const stream = store.create()
      stream.set('id', { id: item.tvg.id })
      stream.set('title', { title: item.name })
      stream.set('filepath', { filepath: item.filepath })
      stream.set('resolution', { title: item.name })
      stream.set('status', { title: item.name })
      stream.set('url', { url: item.url })
      stream.set('http', { http: item.http })
      stream.set('is_broken', { status: stream.get('status') })
      stream.set('updated', { updated: false })
      stream.set('cluster_id', { cluster_id: i + 1 })

      if (!stream.get('id')) {
        const id = cid.generate(item.name, item.filepath)

        stream.set('id', { id })
        stream.set('updated', { updated: true })
      }

      await db.insert(stream.data())
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
