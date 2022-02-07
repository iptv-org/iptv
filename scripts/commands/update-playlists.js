const _ = require('lodash')
const { create: createPlaylist } = require('../core/playlist')
const { db, logger, file } = require('../core')

async function main() {
  await db.streams.load()
  let items = await db.streams
    .find({})
    .sort({ name: 1, 'status.level': 1, 'resolution.height': -1, url: 1 })
  const files = _.groupBy(items, 'filepath')

  for (const filepath in files) {
    let items = files[filepath]
    items = items.sort(naturalOrder)
    const playlist = createPlaylist(items, { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()

function naturalOrder(a, b) {
  return a.channel_name.localeCompare(b.channel_name, undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}
