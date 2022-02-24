const { create: createPlaylist } = require('../../core/playlist')
const { db, logger, file } = require('../../core')
const { orderBy } = require('natural-orderby')
const _ = require('lodash')

async function main() {
  await db.streams.load()
  let streams = await db.streams.find({})
  const levels = { online: 1, blocked: 2, timeout: 3, error: 4, default: 5 }
  streams = orderBy(
    streams,
    ['title', s => levels[s.status] || levels['default'], 'height', 'url'],
    ['asc', 'asc', 'desc', 'asc']
  )

  const files = _.groupBy(streams, 'filepath')
  for (const filepath in files) {
    const playlist = createPlaylist(files[filepath], { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()
