import { Logger, Storage, Collection } from '@freearhey/core'
import { STREAMS_DIR, DATA_DIR } from '../../constants'
import { PlaylistParser } from '../../core'
import { Stream, Playlist, Channel, Feed } from '../../models'
import { program } from 'commander'
import { uniqueId } from 'lodash'

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

async function main() {
  const streamsStorage = new Storage(STREAMS_DIR)
  const logger = new Logger()

  logger.info('loading data from api...')
  const dataStorage = new Storage(DATA_DIR)
  const channelsData = await dataStorage.json('channels.json')
  const channels = new Collection(channelsData).map(data => new Channel(data))
  const channelsGroupedById = channels.keyBy((channel: Channel) => channel.id)
  const feedsData = await dataStorage.json('feeds.json')
  const feeds = new Collection(feedsData).map(data =>
    new Feed(data).withChannel(channelsGroupedById)
  )
  const feedsGroupedByChannelId = feeds.groupBy(feed =>
    feed.channel ? feed.channel.id : uniqueId()
  )

  logger.info('loading streams...')
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsGroupedById,
    feedsGroupedByChannelId
  })
  const files = program.args.length ? program.args : await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)

  logger.info(`found ${streams.count()} streams`)

  logger.info('normalizing links...')
  streams = streams.map(stream => {
    stream.normalizeURL()
    return stream
  })

  logger.info('removing duplicates...')
  streams = streams.uniqBy(stream => stream.url)

  logger.info('removing wrong id...')
  streams = streams.map((stream: Stream) => {
    if (!stream.channel || channelsGroupedById.missing(stream.channel.id)) {
      stream.id = ''
    }

    return stream
  })

  logger.info('sorting links...')
  streams = streams.orderBy(
    [
      (stream: Stream) => stream.name,
      (stream: Stream) => stream.getHorizontalResolution(),
      (stream: Stream) => stream.getLabel(),
      (stream: Stream) => stream.url
    ],
    ['asc', 'desc', 'asc', 'asc']
  )

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (let filepath of groupedStreams.keys()) {
    const streams = groupedStreams.get(filepath) || []

    if (!streams.length) return

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }
}

main()
