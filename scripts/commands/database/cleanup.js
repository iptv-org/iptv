const { db, logger } = require('../../core')
const _ = require('lodash')

async function main() {
  logger.info(`loading streams...`)
  await db.streams.load()
  let streams = await db.streams.find({})

  logger.info(`removing broken links...`)
  let removed = 0
  const failed = _.filter(streams, { status: 'error' })
  for (const stream of failed) {
    const hasDuplicate = _.find(streams, s => s.channel === stream.channel && s.status !== 'error')
    if (hasDuplicate) {
      await db.streams.remove({ _id: stream._id })
      removed++
    }
  }

  db.streams.compact()

  logger.info(`removed ${removed} links`)
}

main()
