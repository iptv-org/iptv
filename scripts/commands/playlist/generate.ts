import { Logger, Storage } from '@freearhey/core'
import { PlaylistParser, DataProcessor, DataLoader } from '../../core'
import { Stream } from '../../models'
import { uniqueId } from 'lodash'
import {
  CategoriesGenerator,
  CountriesGenerator,
  LanguagesGenerator,
  RegionsGenerator,
  IndexGenerator,
  IndexCategoryGenerator,
  IndexCountryGenerator,
  IndexLanguageGenerator,
  IndexRegionGenerator
} from '../../generators'
import { DATA_DIR, LOGS_DIR, STREAMS_DIR } from '../../constants'
import type { DataProcessorData } from '../../types/dataProcessor'
import type { DataLoaderData } from '../../types/dataLoader'

async function main() {
  const logger = new Logger()
  const generatorsLogger = new Logger({
    stream: await new Storage(LOGS_DIR).createStream(`generators.log`)
  })

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const {
    categories,
    countries,
    regions,
    channelsKeyById,
    feedsGroupedByChannelId
  }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsKeyById,
    feedsGroupedByChannelId
  })
  const files = await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)
  const totalStreams = streams.count()
  streams = streams.uniqBy((stream: Stream) =>
    stream.hasId() ? stream.getChannelId() + stream.getFeedId() : uniqueId()
  )
  logger.info(`found ${totalStreams} streams (including ${streams.count()} unique)`)

  logger.info('sorting streams...')
  streams = streams.orderBy(
    [
      (stream: Stream) => stream.getId(),
      (stream: Stream) => stream.getVerticalResolution(),
      (stream: Stream) => stream.getLabel()
    ],
    ['asc', 'asc', 'desc']
  )

  logger.info('generating categories/...')
  await new CategoriesGenerator({ categories, streams, logger: generatorsLogger }).generate()

  logger.info('generating countries/...')
  await new CountriesGenerator({
    countries,
    streams,
    logger: generatorsLogger
  }).generate()

  logger.info('generating languages/...')
  await new LanguagesGenerator({ streams, logger: generatorsLogger }).generate()

  logger.info('generating regions/...')
  await new RegionsGenerator({
    streams,
    regions,
    logger: generatorsLogger
  }).generate()

  logger.info('generating index.m3u...')
  await new IndexGenerator({ streams, logger: generatorsLogger }).generate()

  logger.info('generating index.category.m3u...')
  await new IndexCategoryGenerator({ streams, logger: generatorsLogger }).generate()

  logger.info('generating index.country.m3u...')
  await new IndexCountryGenerator({
    streams,
    logger: generatorsLogger
  }).generate()

  logger.info('generating index.language.m3u...')
  await new IndexLanguageGenerator({ streams, logger: generatorsLogger }).generate()

  logger.info('generating index.region.m3u...')
  await new IndexRegionGenerator({ streams, regions, logger: generatorsLogger }).generate()
}

main()
