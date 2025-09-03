import { DataProcessorData } from '../types/dataProcessor'
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
  City,
  Feed,
  Logo
} from '../models'

export class DataProcessor {
  process(data: DataLoaderData): DataProcessorData {
    let regions = new Collection(data.regions).map(data => new Region(data))
    let regionsKeyByCode = regions.keyBy((region: Region) => region.code)

    const categories = new Collection(data.categories).map(data => new Category(data))
    const categoriesKeyById = categories.keyBy((category: Category) => category.id)

    const languages = new Collection(data.languages).map(data => new Language(data))
    const languagesKeyByCode = languages.keyBy((language: Language) => language.code)

    let subdivisions = new Collection(data.subdivisions).map(data => new Subdivision(data))
    let subdivisionsKeyByCode = subdivisions.keyBy((subdivision: Subdivision) => subdivision.code)
    let subdivisionsGroupedByCountryCode = subdivisions.groupBy(
      (subdivision: Subdivision) => subdivision.countryCode
    )

    let countries = new Collection(data.countries).map(data => new Country(data))
    let countriesKeyByCode = countries.keyBy((country: Country) => country.code)

    const cities = new Collection(data.cities).map(data =>
      new City(data)
        .withRegions(regions)
        .withCountry(countriesKeyByCode)
        .withSubdivision(subdivisionsKeyByCode)
    )
    const citiesKeyByCode = cities.keyBy((city: City) => city.code)
    const citiesGroupedByCountryCode = cities.groupBy((city: City) => city.countryCode)
    const citiesGroupedBySubdivisionCode = cities.groupBy((city: City) => city.subdivisionCode)

    const timezones = new Collection(data.timezones).map(data =>
      new Timezone(data).withCountries(countriesKeyByCode)
    )
    const timezonesKeyById = timezones.keyBy((timezone: Timezone) => timezone.id)

    const blocklistRecords = new Collection(data.blocklist).map(data => new BlocklistRecord(data))
    const blocklistRecordsGroupedByChannelId = blocklistRecords.groupBy(
      (blocklistRecord: BlocklistRecord) => blocklistRecord.channelId
    )

    let channels = new Collection(data.channels).map(data => new Channel(data))
    let channelsKeyById = channels.keyBy((channel: Channel) => channel.id)

    let feeds = new Collection(data.feeds).map(data => new Feed(data))
    let feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)
    let feedsGroupedById = feeds.groupBy((feed: Feed) => feed.id)

    const logos = new Collection(data.logos).map(data => new Logo(data).withFeed(feedsGroupedById))
    const logosGroupedByChannelId = logos.groupBy((logo: Logo) => logo.channelId)
    const logosGroupedByStreamId = logos.groupBy((logo: Logo) => logo.getStreamId())

    const streams = new Collection(data.streams).map(data =>
      new Stream(data).withLogos(logosGroupedByStreamId)
    )
    const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

    const guides = new Collection(data.guides).map(data => new Guide(data))
    const guidesGroupedByStreamId = guides.groupBy((guide: Guide) => guide.getStreamId())

    regions = regions.map((region: Region) =>
      region
        .withCountries(countriesKeyByCode)
        .withRegions(regions)
        .withSubdivisions(subdivisions)
        .withCities(cities)
    )
    regionsKeyByCode = regions.keyBy((region: Region) => region.code)

    countries = countries.map((country: Country) =>
      country
        .withCities(citiesGroupedByCountryCode)
        .withSubdivisions(subdivisionsGroupedByCountryCode)
        .withRegions(regions)
        .withLanguage(languagesKeyByCode)
    )
    countriesKeyByCode = countries.keyBy((country: Country) => country.code)

    subdivisions = subdivisions.map((subdivision: Subdivision) =>
      subdivision
        .withCities(citiesGroupedBySubdivisionCode)
        .withCountry(countriesKeyByCode)
        .withRegions(regions)
        .withParent(subdivisionsKeyByCode)
    )
    subdivisionsKeyByCode = subdivisions.keyBy((subdivision: Subdivision) => subdivision.code)
    subdivisionsGroupedByCountryCode = subdivisions.groupBy(
      (subdivision: Subdivision) => subdivision.countryCode
    )

    channels = channels.map((channel: Channel) =>
      channel
        .withFeeds(feedsGroupedByChannelId)
        .withLogos(logosGroupedByChannelId)
        .withCategories(categoriesKeyById)
        .withCountry(countriesKeyByCode)
        .withSubdivision(subdivisionsKeyByCode)
        .withCategories(categoriesKeyById)
    )
    channelsKeyById = channels.keyBy((channel: Channel) => channel.id)

    feeds = feeds.map((feed: Feed) =>
      feed
        .withChannel(channelsKeyById)
        .withLanguages(languagesKeyByCode)
        .withTimezones(timezonesKeyById)
        .withBroadcastArea(
          citiesKeyByCode,
          subdivisionsKeyByCode,
          countriesKeyByCode,
          regionsKeyByCode
        )
    )
    feedsGroupedByChannelId = feeds.groupBy((feed: Feed) => feed.channelId)
    feedsGroupedById = feeds.groupBy((feed: Feed) => feed.id)

    return {
      blocklistRecordsGroupedByChannelId,
      subdivisionsGroupedByCountryCode,
      feedsGroupedByChannelId,
      guidesGroupedByStreamId,
      logosGroupedByStreamId,
      subdivisionsKeyByCode,
      countriesKeyByCode,
      languagesKeyByCode,
      streamsGroupedById,
      categoriesKeyById,
      timezonesKeyById,
      regionsKeyByCode,
      blocklistRecords,
      channelsKeyById,
      citiesKeyByCode,
      subdivisions,
      categories,
      countries,
      languages,
      timezones,
      channels,
      regions,
      streams,
      cities,
      guides,
      feeds,
      logos
    }
  }
}
