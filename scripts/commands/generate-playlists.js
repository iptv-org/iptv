const { db, generator, api } = require('../core')
const _ = require('lodash')

async function main() {
  const streams = await loadStreams()

  await generator.generate('categories', streams)
  await generator.generate('countries', streams)
  await generator.generate('languages', streams)
  await generator.generate('regions', streams)
  await generator.generate('index_category_m3u', streams)
  await generator.generate('index_country_m3u', streams)
  await generator.generate('index_language_m3u', streams)
  await generator.generate('index_m3u', streams)
  await generator.generate('index_nsfw_m3u', streams)
  await generator.generate('index_region_m3u', streams)
}

main()

async function loadStreams() {
  await api.channels.load()
  let channels = await api.channels.all()
  channels = _.keyBy(channels, 'id')

  await api.countries.load()
  let countries = await api.countries.all()
  countries = _.keyBy(countries, 'code')

  await api.categories.load()
  let categories = await api.categories.all()
  categories = _.keyBy(categories, 'id')

  await api.languages.load()
  let languages = await api.languages.all()
  languages = _.keyBy(languages, 'code')

  await api.regions.load()
  let regions = await api.regions.all()
  regions = _.keyBy(regions, 'code')

  await api.guides.load()
  let guides = await api.guides.all()
  guides = _.groupBy(guides, 'channel')

  await db.streams.load()
  let streams = await db.streams.find({})

  return streams.map(stream => {
    const channel = channels[stream.channel_id] || null

    stream.channel = channel
    if (channel) {
      stream.broadcast_area = channel.broadcast_area.map(item => {
        const [_, code] = item.split('/')
        return code
      })
      stream.regions = channel.broadcast_area
        .reduce((acc, item) => {
          const [type, code] = item.split('/')
          switch (type) {
            case 'r':
              acc.push(regions[code])
              break
            case 's':
              const [c] = item.split('-')
              const r1 = _.filter(regions, { countries: [c] })
              acc = acc.concat(r1)
              break
            case 'c':
              const r2 = _.filter(regions, { countries: [code] })
              acc = acc.concat(r2)
              break
          }
          return acc
        }, [])
        .filter(i => i)
      stream.categories = channel.categories.map(id => categories[id])
      stream.languages = channel.languages.map(code => languages[code])
      stream.guides = guides[stream.channel_id] ? guides[stream.channel_id].map(g => g.url) : []
    } else {
      stream.broadcast_area = []
      stream.categories = []
      stream.languages = []
      stream.regions = []
      stream.guides = []
    }

    return stream
  })
}
