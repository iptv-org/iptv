const { db, generator, api, logger } = require('../core')
const _ = require('lodash')

async function main() {
  const streams = await loadStreams()

  logger.info('generating categories/...')
  await generator.generate('categories', streams)
  logger.info('generating countries/...')
  await generator.generate('countries', streams)
  logger.info('generating languages/...')
  await generator.generate('languages', streams)
  logger.info('generating regions/...')
  await generator.generate('regions', streams)
  logger.info('generating index.category.m3u...')
  await generator.generate('index_category_m3u', streams)
  logger.info('generating index.country.m3u...')
  await generator.generate('index_country_m3u', streams)
  logger.info('generating index.language.m3u...')
  await generator.generate('index_language_m3u', streams)
  logger.info('generating index.m3u...')
  await generator.generate('index_m3u', streams)
  logger.info('generating index.nsfw.m3u...')
  await generator.generate('index_nsfw_m3u', streams)
  logger.info('generating index.region.m3u...')
  await generator.generate('index_region_m3u', streams)
}

main()

async function loadStreams() {
  await db.streams.load()
  let streams = await db.streams.find({})

  await api.channels.load()
  let channels = await api.channels.all()
  channels = _.keyBy(channels, 'id')

  await api.categories.load()
  let categories = await api.categories.all()
  categories = _.keyBy(categories, 'id')

  await api.languages.load()
  let languages = await api.languages.all()
  languages = _.keyBy(languages, 'code')

  await api.guides.load()
  let guides = await api.guides.all()
  guides = _.groupBy(guides, 'channel')

  return streams.map(stream => {
    const channel = channels[stream.channel_id] || null

    if (channel) {
      stream.group_title = channel.categories
        .map(id => (categories[id] ? categories[id].name : null))
        .filter(i => i)
        .sort()
        .join(';')
      stream.tvg_language = channel.languages
        .map(code => (languages[code] ? languages[code].name : ''))
        .filter(i => i)
        .sort()
        .join(';')
      stream.tvg_country = channel.broadcast_area
        .map(item => {
          const [_, code] = item.split('/')
          return code
        })
        .filter(i => i)
        .sort()
        .join(';')
      stream.tvg_logo = channel.logo
      stream.tvg_url =
        guides[channel.id] && guides[channel.id].length ? guides[channel.id][0].url : null
      stream.channel = channel
    }

    return stream
  })
}
