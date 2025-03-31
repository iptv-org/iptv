import { Logger, Storage, Collection } from '@freearhey/core'
import { PlaylistParser } from '../../core'
import {
  Stream,
  Category,
  Channel,
  Language,
  Country,
  Region,
  Subdivision,
  Feed,
  Timezone
} from '../../models'
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

async function main() {
  const logger = new Logger()
  const dataStorage = new Storage(DATA_DIR)
  const generatorsLogger = new Logger({
    stream: await new Storage(LOGS_DIR).createStream(`generators.log`)
  })

  logger.info('loading data from api...')
  const categoriesData = await dataStorage.json('categories.json')
  const countriesData = await dataStorage.json('countries.json')
  const languagesData = await dataStorage.json('languages.json')
  const regionsData = await dataStorage.json('regions.json')
  const subdivisionsData = await dataStorage.json('subdivisions.json')
  const timezonesData = await dataStorage.json('timezones.json')
  const channelsData = await dataStorage.json('channels.json')
  const feedsData = await dataStorage.json('feeds.json')

  logger.info('preparing data...')
  const subdivisions = new Collection(subdivisionsData).map(data => new Subdivision(data))
  const subdivisionsGroupedByCode = subdivisions.keyBy(
    (subdivision: Subdivision) => subdivision.code
  )
  const subdivisionsGroupedByCountryCode = subdivisions.groupBy(
    (subdivision: Subdivision) => subdivision.countryCode
  )
  let regions = new Collection(regionsData).map(data =>
    new Region(data).withSubdivisions(subdivisions)
  )
  const regionsGroupedByCode = regions.keyBy((region: Region) => region.code)
  const categories = new Collection(categoriesData).map(data => new Category(data))
  const categoriesGroupedById = categories.keyBy((category: Category) => category.id)
  const languages = new Collection(languagesData).map(data => new Language(data))
  const languagesGroupedByCode = languages.keyBy((language: Language) => language.code)
  const countries = new Collection(countriesData).map(data =>
    new Country(data)
      .withRegions(regions)
      .withLanguage(languagesGroupedByCode)
      .withSubdivisions(subdivisionsGroupedByCountryCode)
  )
  const countriesGroupedByCode = countries.keyBy((country: Country) => country.code)
  regions = regions.map((region: Region) => region.withCountries(countriesGroupedByCode))

  const timezones = new Collection(timezonesData).map(data =>
    new Timezone(data).withCountries(countriesGroupedByCode)
  )
  const timezonesGroupedById = timezones.keyBy((timezone: Timezone) => timezone.id)

  const channels = new Collection(channelsData).map(data =>
    new Channel(data)
      .withCategories(categoriesGroupedById)
      .withCountry(countriesGroupedByCode)
      .withSubdivision(subdivisionsGroupedByCode)
  )
  const channelsGroupedById = channels.keyBy((channel: Channel) => channel.id)
  const feeds = new Collection(feedsData).map(data =>
    new Feed(data)
      .withChannel(channelsGroupedById)
      .withLanguages(languagesGroupedByCode)
      .withTimezones(timezonesGroupedById)
      .withBroadcastCountries(
        countriesGroupedByCode,
        regionsGroupedByCode,
        subdivisionsGroupedByCode
      )
      .withBroadcastRegions(regions)
      .withBroadcastSubdivisions(subdivisionsGroupedByCode)
  )
  const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) =>
    feed.channel ? feed.channel.id : uniqueId()
  )

  logger.info('loading streams...')
  const storage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage,
    channelsGroupedById,
    feedsGroupedByChannelId
  })
  const files = await storage.list('**/*.m3u')
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
