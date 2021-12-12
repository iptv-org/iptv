const { db, logger } = require('../core')

async function main() {
  const removed = await db.remove(
    { 'status.code': { $in: ['timeout', 'offline'] } },
    { multi: true }
  )

  db.compact()

  logger.info(`Removed ${removed} links`)
}

main()
