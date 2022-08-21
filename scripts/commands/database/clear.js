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

  let total = 0
  for (const stream of streams) {
    if (
      stream.status === 'error' &&
      date.utc().diff(stream.updated_at, 'day') >= options.threshold
    ) {
      total += await db.streams.remove({ url: stream.url }, { multi: true })
    }
  }

  await db.streams.compact()

  logger.info(`removed ${total} streams`)
}

main()
