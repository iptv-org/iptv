import { PlaylistParser, DataProcessor, DataLoader } from '../../core'
import type { DataProcessorData } from '../../types/dataProcessor'
import { DATA_DIR, LOGS_DIR, STREAMS_DIR } from '../../constants'
import type { DataLoaderData } from '../../types/dataLoader'
import { Logger, Storage, File } from '@freearhey/core'
import { Stream } from '../../models'
import uniqueId from 'lodash.uniqueid'
import {
  IndexCategoryGenerator,
  IndexLanguageGenerator,
  IndexCountryGenerator,
  SubdivisionsGenerator,
  IndexRegionGenerator,
  CategoriesGenerator,
  CountriesGenerator,
  LanguagesGenerator,
  RegionsGenerator,
  SourcesGenerator,
  IndexGenerator,
  RawGenerator
} from '../../generators'

async function main() {
  const logger = new Logger()
  const logFile = new File('generators.log')

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const {
    feedsGroupedByChannelId,
    logosGroupedByStreamId,
    channelsKeyById,
    subdivisions,
    categories,
    countries,
    regions
  }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    feedsGroupedByChannelId,
    logosGroupedByStreamId,
    channelsKeyById
  })
  const files = await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)
  const totalStreams = streams.count()
  logger.info(`found ${totalStreams} streams`)

  logger.info('generating raw/...')
  await new RawGenerator({ streams, logFile }).generate()

  logger.info('filtering streams...')
  streams = streams.uniqBy((stream: Stream) =>
    stream.hasId() ? stream.getChannelId() + stream.getFeedId() : uniqueId()
  )

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
  await new CategoriesGenerator({ categories, streams, logFile }).generate()

  logger.info('generating languages/...')
  await new LanguagesGenerator({ streams, logFile }).generate()

  logger.info('generating countries/...')
  await new CountriesGenerator({
    countries,
    streams,
    logFile
  }).generate()

  logger.info('generating subdivisions/...')
  await new SubdivisionsGenerator({
    subdivisions,
    streams,
    logFile
  }).generate()

  logger.info('generating regions/...')
  await new RegionsGenerator({
    streams,
    regions,
    logFile
  }).generate()

  logger.info('generating sources/...')
  await new SourcesGenerator({ streams, logFile }).generate()

  logger.info('generating index.m3u...')
  await new IndexGenerator({ streams, logFile }).generate()

  logger.info('generating index.category.m3u...')
  await new IndexCategoryGenerator({ streams, logFile }).generate()

  logger.info('generating index.country.m3u...')
  await new IndexCountryGenerator({
    streams,
    logFile
  }).generate()

  logger.info('generating index.language.m3u...')
  await new IndexLanguageGenerator({ streams, logFile }).generate()

  logger.info('generating index.region.m3u...')
  await new IndexRegionGenerator({ streams, regions, logFile }).generate()

  logger.info('saving generators.log...')
  const logStorage = new Storage(LOGS_DIR)
  logStorage.saveFile(logFile)
}

main()
