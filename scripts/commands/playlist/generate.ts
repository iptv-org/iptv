import { LOGS_DIR, STREAMS_DIR } from '../../constants'
import { Storage, File } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import { loadData, data } from '../../api'
import { Logger, Collection } from '@freearhey/core'
import uniqueId from 'lodash.uniqueid'
import { Stream } from '../../models'
import axios from 'axios'
import {
  IndexCategoryGenerator,
  IndexLanguageGenerator,
  IndexCountryGenerator,
  SubdivisionsGenerator,
  CategoriesGenerator,
  CountriesGenerator,
  LanguagesGenerator,
  RegionsGenerator,
  SourcesGenerator,
  CitiesGenerator,
  IndexGenerator,
  RawGenerator
} from '../../generators'
import async from 'async'

async function checkStreamActive(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 3000 });
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    return false;
  }
}

async function main() {
  const logger = new Logger()
  const logFile = new File('generators.log')

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)
  streams = streams.map((stream: Stream) => {
    stream.setGuides(data.guidesGroupedByStreamId.get(stream.getId()))
    return stream
  })
  const totalStreams = streams.count()
  logger.info(`found ${totalStreams} streams`)

  logger.info('pinging streams to verify they are active...')
  const activeStreams: Stream[] = []

  await async.eachLimit(streams.all(), 50, async (stream) => {
    const isActive = await checkStreamActive(stream.url);
    if (isActive) {
      activeStreams.push(stream);
    }
  });

  streams = new Collection(activeStreams)
  logger.info(`found ${streams.count()} active streams out of ${totalStreams}`)

  logger.info('generating raw/...')
  await new RawGenerator({ streams, logFile }).generate()

  logger.info('sorting streams...')
  streams = streams.sortBy(
    [
      (stream: Stream) => stream.getId(),
      (stream: Stream) => stream.getVerticalResolution(),
      (stream: Stream) => stream.label
    ],
    ['asc', 'desc', 'desc']
  )

  logger.info('filtering streams...')
  streams = streams.uniqBy((stream: Stream) => stream.getId() || uniqueId())

  const { categories, countries, subdivisions, cities, regions } = data

  logger.info('generating categories/...')
  await new CategoriesGenerator({ categories, streams, logFile }).generate()

  logger.info('generating languages/...')
  await new LanguagesGenerator({ streams, logFile }).generate()

  logger.info('generating countries/...')
  await new CountriesGenerator({ countries, streams, logFile }).generate()

  logger.info('generating subdivisions/...')
  await new SubdivisionsGenerator({ subdivisions, streams, logFile }).generate()

  logger.info('generating cities/...')
  await new CitiesGenerator({ cities, streams, logFile }).generate()

  logger.info('generating regions/...')
  await new RegionsGenerator({ streams, regions, logFile }).generate()

  logger.info('generating sources/...')
  await new SourcesGenerator({ streams, logFile }).generate()

  logger.info('generating index.m3u...')
  await new IndexGenerator({ streams, logFile }).generate()

  logger.info('generating index.category.m3u...')
  await new IndexCategoryGenerator({ streams, logFile }).generate()

  logger.info('generating index.country.m3u...')
  await new IndexCountryGenerator({ streams, logFile }).generate()

  logger.info('generating index.language.m3u...')
  await new IndexLanguageGenerator({ streams, logFile }).generate()

  logger.info('saving generators.log...')
  const logStorage = new Storage(LOGS_DIR)
  logStorage.saveFile(logFile)
}

main()
