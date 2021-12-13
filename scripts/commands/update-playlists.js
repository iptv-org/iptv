const _ = require('lodash')
const { generator, db, logger } = require('../core')

async function main() {
  let items = await db
    .find({})
    .sort({ name: 1, 'status.level': 1, 'resolution.height': -1, url: 1 })
  const files = _.groupBy(items, 'filepath')

  for (const filepath in files) {
    const items = files[filepath]
    await generator.saveAsM3U(filepath, items, { includeGuides: false })
  }
}

main()
