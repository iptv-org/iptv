const { create: createPlaylist } = require('../../core/playlist')
const { db, logger, file } = require('../../core')
const { orderBy } = require('natural-orderby')
const _ = require('lodash')

async function main() {
  await db.streams.load()
  let items = await db.streams
    .find({})
    .sort({ name: 1, 'status.level': 1, 'resolution.height': -1, url: 1 })
  const files = _.groupBy(items, 'filepath')

  for (const filepath in files) {
    let items = files[filepath]
    items = orderBy(items, ['channel_name'], ['asc'])
    const playlist = createPlaylist(items, { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()
