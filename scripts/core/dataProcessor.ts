import { DataLoaderData } from '../types/dataLoader'
import { Collection } from '@freearhey/core'
import {
  BlocklistRecord,
  Subdivision,
  Category,
  Language,
  Timezone,
  Channel,
  Country,
  Region,
  Stream,
  Guide,
  Feed
} from '../models'

export class DataProcessor {
  constructor() {}

  process(data: DataLoaderData) {
    const categories = new Collection(data.categories).map(data => new Category(data))
    const categoriesKeyById = categories.keyBy((category: Category) => category.id)

    const subdivisions = new Collection(data.subdivisions).map(data => new Subdivision(data))
    const subdivisionsKeyByCode = subdivisions.keyBy((subdivision: Subdivision) => subdivision.code)
    const subdivisionsGroupedByCountryCode = subdivisions.groupBy(
      (subdivision: Subdivision) => subdivision.countryCode
    )

    let regions = new Collection(data.regions).map(data => new Region(data))
    const regionsKeyByCode = regions.keyBy((region: Region) => region.code)

    const blocklistRecords = new Collection(data.blocklist).map(data => new BlocklistRecord(data))
    const blocklistRecordsGroupedByChannelId = blocklistRecords.groupBy(
      (blocklistRecord: BlocklistRecord) => blocklistRecord.channelId
    )

    const streams = new Collection(data.streams).map(data => new Stream(data))
    const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

    const guides = new Collection(data.guides).map(data => new Guide(data))
    const guidesGroupedByStreamId = guides.groupBy((guide: Guide) => guide.getStreamId())

    const languages = new Collection(data.languages).map(data => new Language(data))
    const languagesKeyByCode = languages.keyBy((language: Language) => language.code)

    const countries = new Collection(data.countries).map(data =>
      new Country(data)
        .withRegions(regions)
        .withLanguage(languagesKeyByCode)
        .withSubdivisions(subdivisionsGroupedByCountryCode)
    )
    const countriesKeyByCode = countries.keyBy((country: Country) => country.code)

    regions = regions.map((region: Region) => region.withCountries(countriesKeyByCode))

    const timezones = new Collection(data.timezones).map(data =>
      new Timezone(data).withCountries(countriesKeyByCode)
    )
    const timezonesKeyById = timezones.keyBy((timezone: Timezone) => timezone.id)

    let channels = new Collection(data.channels).map(data =>
      new Channel(data)
        .withCategories(categoriesKeyById)
        .withCountry(countriesKeyByCode)
        .withSubdivision(subdivisionsKeyByCode)
        .withCategories(categoriesKeyById)
    )
    const channelsKeyById = channels.keyBy((channel: Channel) => channel.id)

    let feeds = new Collection(data.feeds).map(data =>
      new Feed(data)
        .withChannel(channelsKeyById)
        .withLanguages(languagesKeyByCode)
        .withTimezones(timezonesKeyById)
        .withBroadcastCountries(countriesKeyByCode, regionsKeyByCode, subdivisionsKeyByCode)
        .withBroadcastRegions(regions)
        .withBroadcastSubdivisions(subdivisionsKeyByCode)
    )
    const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)

    channels = channels.map((channel: Channel) => channel.withFeeds(feedsGroupedByChannelId))

    return {
      blocklistRecordsGroupedByChannelId,
      subdivisionsGroupedByCountryCode,
      feedsGroupedByChannelId,
      guidesGroupedByStreamId,
      subdivisionsKeyByCode,
      countriesKeyByCode,
      languagesKeyByCode,
      streamsGroupedById,
      categoriesKeyById,
      timezonesKeyById,
      regionsKeyByCode,
      blocklistRecords,
      channelsKeyById,
      subdivisions,
      categories,
      countries,
      languages,
      timezones,
      channels,
      regions,
      streams,
      guides,
      feeds
    }
  }
}
