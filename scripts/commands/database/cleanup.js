const { db, logger } = require('../../core')

async function main() {
  logger.info(`loading streams...`)
  await db.streams.load()
  let streams = await db.streams.find({})

  logger.info(`removing broken links...`)
  let removed = 0
  const buffer = {}
  for (const stream of streams) {
    const duplicate = buffer[stream.channel]
    if (duplicate && !stream.is_online) {
      await db.streams.remove({ _id: stream._id })
      removed++
    } else {
      buffer[stream.channel] = stream
    }
  }
  db.streams.compact()

  logger.info(`removed ${removed} links`)
}

main()
