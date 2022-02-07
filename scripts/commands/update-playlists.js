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
    const items = files[filepath]
    const playlist = createPlaylist(items, { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()
