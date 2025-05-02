import { Collection, Dictionary } from '@freearhey/core'

export type DataProcessorData = {
  blocklistRecordsGroupedByChannelId: Dictionary
  subdivisionsGroupedByCountryCode: Dictionary
  feedsGroupedByChannelId: Dictionary
  guidesGroupedByStreamId: Dictionary
  subdivisionsKeyByCode: Dictionary
  countriesKeyByCode: Dictionary
  languagesKeyByCode: Dictionary
  streamsGroupedById: Dictionary
  categoriesKeyById: Dictionary
  timezonesKeyById: Dictionary
  regionsKeyByCode: Dictionary
  blocklistRecords: Collection
  channelsKeyById: Dictionary
  subdivisions: Collection
  categories: Collection
  countries: Collection
  languages: Collection
  timezones: Collection
  channels: Collection
  regions: Collection
  streams: Collection
  guides: Collection
  feeds: Collection
}
