const { db, generator, api, logger, file } = require('../../core')
const { orderBy } = require('natural-orderby')
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
  streams = _.filter(streams, stream => stream.status !== 'error')
  const levels = { online: 1, blocked: 2, timeout: 3, error: 4, default: 5 }
  streams = orderBy(
    streams,
    ['channel', s => levels[s.status] || levels['default'], 'height', 'url'],
    ['asc', 'asc', 'desc', 'asc']
  )
  streams = _.uniqBy(streams, stream => stream.channel || _.uniqueId())

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

  streams = streams.map(stream => {
    const channel = channels[stream.channel] || null
    const filename = file.getFilename(stream.filepath)
    const [_, code] = filename.match(/^([a-z]{2})(_|$)/) || [null, null]
    const defaultBroadcastArea = code ? [`c/${code.toUpperCase()}`] : []

    stream.guides = channel && Array.isArray(guides[channel.id]) ? guides[channel.id] : []
    stream.categories = channel ? channel.categories.map(id => categories[id]) : []
    stream.languages = channel ? channel.languages.map(id => languages[id]) : []
    stream.broadcast_area = channel ? channel.broadcast_area : defaultBroadcastArea
    stream.is_nsfw = channel ? channel.is_nsfw : false
    stream.logo = channel ? channel.logo : null

    return stream
  })

  streams = orderBy(streams, ['title'], ['asc'])

  return streams
}
