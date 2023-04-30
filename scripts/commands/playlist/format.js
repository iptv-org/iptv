const { create: createPlaylist } = require('../../core/playlist')
const { db, api, logger, file } = require('../../core')
const { orderBy } = require('natural-orderby')
const _ = require('lodash')

async function main() {
  logger.info('loading streams...')
  await db.streams.load()
  let streams = await db.streams.find({})

  logger.info(`loading channels...`)
  await api.channels.load()
  const channels = _.keyBy(await api.channels.all(), 'id')

  logger.info('removing invalid tvg-id...')
  streams = streams.map(stream => {
    const channel = channels[stream.channel]

    if (!channel) {
      stream.channel = null
    }

    return stream
  })

  logger.info('sorting links...')
  streams = orderBy(
    streams,
    ['channel', s => (s.channel ? '' : s.title), 'url'],
    ['asc', 'asc', 'asc']
  )

  logger.info('saving...')
  const files = _.groupBy(streams, 'filepath')
  for (const filepath in files) {
    const playlist = createPlaylist(files[filepath], { public: false })
    await file.create(filepath, playlist.toString())
  }
}

main()
