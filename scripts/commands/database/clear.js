const { logger, parser, db, date } = require('../../core')
const { program } = require('commander')

const options = program
  .option(
    '-t, --threshold <threshold>',
    'Number of days after which the stream should be deleted',
    parser.parseNumber,
    7
  )
  .option('--input-dir <input-dir>', 'Set path to input directory', 'streams')
  .parse(process.argv)
  .opts()

async function main() {
  await db.streams.load()

  const streams = await db.streams.all()

  let buffer = {}
  let removed = 0
  logger.info('searching...')
  for (const stream of streams) {
    if (
      stream.status === 'error' &&
      date.utc().diff(stream.updated_at, 'day') >= options.threshold
    ) {
      logger.info(`${stream.url} (offline)`)
      removed += await db.streams.remove({ url: stream.url }, { multi: true })
    }

    const key = stream.url.toLowerCase()
    if (buffer[key]) {
      logger.info(`${stream.url} (duplicate)`)
      await db.streams.remove({ _id: stream._id })
      removed++
    } else {
      buffer[key] = true
    }
  }

  await db.streams.compact()

  logger.info(`removed ${removed} streams`)
}

main()
