const { db, logger } = require('../core')

async function main() {
  logger.info(`Loading database...`)
  let streams = await db.find({})

  logger.info(`Removing broken links...`)
  let removed = 0
  const buffer = []
  for (const stream of streams) {
    const duplicate = buffer.find(i => i.id === stream.id)
    if (duplicate && ['offline', 'timeout'].includes(stream.status.code)) {
      await db.remove({ _id: stream._id })
      removed++
    } else {
      buffer.push(stream)
    }
  }
  db.compact()

  logger.info(`Removed ${removed} links`)
}

main()
