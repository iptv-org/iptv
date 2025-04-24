import { DataLoader, DataProcessor, PlaylistParser } from '../../core'
import type { DataProcessorData } from '../../types/dataProcessor'
import { API_DIR, STREAMS_DIR, DATA_DIR } from '../../constants'
import type { DataLoaderData } from '../../types/dataLoader'
import { Logger, Storage } from '@freearhey/core'
import { Stream } from '../../models'

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const dataLoader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await dataLoader.load()
  const { channelsKeyById, feedsGroupedByChannelId }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsKeyById,
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
