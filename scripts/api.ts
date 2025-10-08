import { Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR } from './constants'
import cliProgress from 'cli-progress'
import * as sdk from '@iptv-org/sdk'

const data = {
  categoriesKeyById: new Dictionary<sdk.Models.Category>(),
  countriesKeyByCode: new Dictionary<sdk.Models.Country>(),
  subdivisionsKeyByCode: new Dictionary<sdk.Models.Subdivision>(),
  citiesKeyByCode: new Dictionary<sdk.Models.City>(),
  regionsKeyByCode: new Dictionary<sdk.Models.Region>(),
  languagesKeyByCode: new Dictionary<sdk.Models.Language>(),
  channelsKeyById: new Dictionary<sdk.Models.Channel>(),
  feedsKeyByStreamId: new Dictionary<sdk.Models.Feed>(),
  feedsGroupedByChannel: new Dictionary<sdk.Models.Feed[]>(),
  blocklistRecordsGroupedByChannel: new Dictionary<sdk.Models.BlocklistRecord[]>(),
  categories: new Collection<sdk.Models.Category>(),
  countries: new Collection<sdk.Models.Country>(),
  subdivisions: new Collection<sdk.Models.Subdivision>(),
  cities: new Collection<sdk.Models.City>(),
  regions: new Collection<sdk.Models.Region>()
}

let searchIndex

async function loadData() {
  const dataManager = new sdk.DataManager({ dataDir: DATA_DIR })
  await dataManager.loadFromDisk()
  dataManager.processData()

  const {
    channels,
    feeds,
    categories,
    languages,
    countries,
    subdivisions,
    cities,
    regions,
    blocklist
  } = dataManager.getProcessedData()

  searchIndex = sdk.SearchEngine.createIndex<sdk.Models.Channel>(channels)

  data.categoriesKeyById = categories.keyBy((category: sdk.Models.Category) => category.id)
  data.countriesKeyByCode = countries.keyBy((country: sdk.Models.Country) => country.code)
  data.subdivisionsKeyByCode = subdivisions.keyBy(
    (subdivision: sdk.Models.Subdivision) => subdivision.code
  )
  data.citiesKeyByCode = cities.keyBy((city: sdk.Models.City) => city.code)
  data.regionsKeyByCode = regions.keyBy((region: sdk.Models.Region) => region.code)
  data.languagesKeyByCode = languages.keyBy((language: sdk.Models.Language) => language.code)
  data.channelsKeyById = channels.keyBy((channel: sdk.Models.Channel) => channel.id)
  data.feedsKeyByStreamId = feeds.keyBy((feed: sdk.Models.Feed) => feed.getStreamId())
  data.feedsGroupedByChannel = feeds.groupBy((feed: sdk.Models.Feed) => feed.channel)
  data.blocklistRecordsGroupedByChannel = blocklist.groupBy(
    (blocklistRecord: sdk.Models.BlocklistRecord) => blocklistRecord.channel
  )
  data.categories = categories
  data.countries = countries
  data.subdivisions = subdivisions
  data.cities = cities
  data.regions = regions
}

async function downloadData() {
  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const files = [
    'blocklist',
    'categories',
    'channels',
    'cities',
    'countries',
    'feeds',
    'guides',
    'languages',
    'logos',
    'regions',
    'streams',
    'subdivisions',
    'timezones'
  ]

  const multiBar = new cliProgress.MultiBar({
    stopOnComplete: true,
    hideCursor: true,
    forceRedraw: true,
    barsize: 36,
    format(options, params, payload) {
      const filename = payload.filename.padEnd(18, ' ')
      const barsize = options.barsize || 40
      const percent = (params.progress * 100).toFixed(2)
      const speed = payload.speed ? formatBytes(payload.speed) + '/s' : 'N/A'
      const total = formatBytes(params.total)
      const completeSize = Math.round(params.progress * barsize)
      const incompleteSize = barsize - completeSize
      const bar =
        options.barCompleteString && options.barIncompleteString
          ? options.barCompleteString.substr(0, completeSize) +
            options.barGlue +
            options.barIncompleteString.substr(0, incompleteSize)
          : '-'.repeat(barsize)

      return `${filename} [${bar}] ${percent}% | ETA: ${params.eta}s | ${total} | ${speed}`
    }
  })

  const dataManager = new sdk.DataManager({ dataDir: DATA_DIR })

  const requests: Promise<unknown>[] = []
  for (const basename of files) {
    const filename = `${basename}.json`
    const progressBar = multiBar.create(0, 0, { filename })
    const request = dataManager.downloadFileToDisk(basename, {
      onDownloadProgress({ total, loaded, rate }) {
        if (total) progressBar.setTotal(total)
        progressBar.update(loaded, { speed: rate })
      }
    })

    requests.push(request)
  }

  await Promise.allSettled(requests).catch(console.error)
}

function searchChannels(query: string): Collection<sdk.Models.Channel> {
  if (!searchIndex) return new Collection<sdk.Models.Channel>()

  const results = searchIndex.search(query)

  const channels = new Collection<sdk.Models.Channel>()

  new Collection<sdk.Types.ChannelSearchableData>(results).forEach(
    (item: sdk.Types.ChannelSearchableData) => {
      const channel = data.channelsKeyById.get(item.id)
      if (channel) channels.add(channel)
    }
  )

  return channels
}

export { data, loadData, downloadData, searchChannels }
