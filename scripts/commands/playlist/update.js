const { create: createPlaylist } = require('../../core/playlist')
const { db, logger, file } = require('../../core')
const { orderBy } = require('natural-orderby')
const _ = require('lodash')

async function main() {
  await db.streams.load()
  let streams = await db.streams.find({})
  streams = orderBy(streams, ['title', 'height', 'url'], ['asc', 'desc', 'asc'])

  const files = _.groupBy(streams, 'filepath')
  for (const filepath in files) {
    const playlist = createPlaylist(files[filepath], { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()
