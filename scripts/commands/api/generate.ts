import { Logger, Storage, Collection } from '@freearhey/core'
import { API_DIR, STREAMS_DIR, DATA_DIR } from '../../constants'
import { PlaylistParser } from '../../core'
import { Stream, Channel, Feed } from '../../models'
import { uniqueId } from 'lodash'

async function main() {
  const logger = new Logger()

  logger.info('loading api data...')
  const dataStorage = new Storage(DATA_DIR)
  const channelsData = await dataStorage.json('channels.json')
  const channels = new Collection(channelsData).map(data => new Channel(data))
  const channelsGroupedById = channels.keyBy((channel: Channel) => channel.id)
  const feedsData = await dataStorage.json('feeds.json')
  const feeds = new Collection(feedsData).map(data =>
    new Feed(data).withChannel(channelsGroupedById)
  )
  const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) =>
    feed.channel ? feed.channel.id : uniqueId()
  )

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsGroupedById,
    feedsGroupedByChannelId
  })
  const files = await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)
  streams = streams
    .orderBy((stream: Stream) => stream.getId())
    .map((stream: Stream) => stream.toJSON())
  logger.info(`found ${streams.count()} streams`)

  logger.info('saving to .api/streams.json...')
  const apiStorage = new Storage(API_DIR)
  await apiStorage.save('streams.json', streams.toJSON())
}

main()
