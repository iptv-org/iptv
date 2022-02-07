const { create: createPlaylist } = require('../core/playlist')
const { db, logger, generator, file, api } = require('../core')
const _ = require('lodash')

async function main() {
  const streams = await loadStreams()
  // console.log(streams)
  await generator.generate('categories', streams)
  await generator.generate('countries', streams)
  await generator.generate('languages', streams)
  await generator.generate('regions', streams)
  await generator.generate('index_m3u', streams)
  await generator.generate('index_nsfw_m3u', streams)
  await generator.generate('index_category_m3u', streams)
  await generator.generate('index_country_m3u', streams)

  // await generateIndexCountry()
  // await generateIndexLanguage()
  // await generateIndexRegion()
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
      stream.categories = channel.categories.map(id => categories[id])
      stream.languages = channel.languages.map(code => languages[code])
      stream.guides = guides[stream.channel_id] ? guides[stream.channel_id].map(g => g.url) : []
    } else {
      stream.broadcast_area = []
      stream.categories = []
      stream.languages = []
      stream.guides = []
    }

    return stream
  })
}

// async function generateIndexCountry() {
//   logger.info(`Generating index.country.m3u...`)

//   await generator.generate(
//     `${PUBLIC_PATH}/index.country.m3u`,
//     {},
//     {
//       onLoad: function (items) {
//         let results = items
//           .filter(item => !item.countries || !item.countries.length)
//           .map(item => {
//             const newItem = _.cloneDeep(item)
//             newItem.group_title = 'Undefined'
//             newItem.categories = []
//             return newItem
//           })
//         for (const country of _.sortBy(Object.values(countries), ['name'])) {
//           let filtered = items
//             .filter(item => {
//               return (
//                 Array.isArray(item.countries) &&
//                 item.countries.map(c => c.code).includes(country.code)
//               )
//             })
//             .map(item => {
//               const newItem = _.cloneDeep(item)
//               newItem.group_title = country.name
//               return newItem
//             })
//           results = results.concat(filtered)
//         }

//         return results
//       },
//       sortBy: item => {
//         if (item.group_title === 'Undefined') return '_'
//         return item.group_title
//       }
//     }
//   )
// }

// async function generateIndexLanguage() {
//   logger.info(`Generating index.language.m3u...`)

//   await generator.generate(
//     `${PUBLIC_PATH}/index.language.m3u`,
//     {},
//     {
//       onLoad: function (items) {
//         let results = items
//           .filter(item => !item.languages || !item.languages.length)
//           .map(item => {
//             const newItem = _.cloneDeep(item)
//             newItem.group_title = 'Undefined'
//             newItem.categories = []
//             return newItem
//           })
//         for (const language of languages) {
//           let filtered = items
//             .filter(item => {
//               return (
//                 Array.isArray(item.languages) &&
//                 item.languages.map(c => c.code).includes(language.code)
//               )
//             })
//             .map(item => {
//               const newItem = _.cloneDeep(item)
//               newItem.group_title = language.name
//               return newItem
//             })
//           results = results.concat(filtered)
//         }

//         return results
//       },
//       sortBy: item => {
//         if (item.group_title === 'Undefined') return '_'
//         return item.group_title
//       }
//     }
//   )
// }

// async function generateIndexRegion() {
//   logger.info(`Generating index.region.m3u...`)

//   await generator.generate(
//     `${PUBLIC_PATH}/index.region.m3u`,
//     {},
//     {
//       onLoad: function (items) {
//         let results = items
//           .filter(item => !item.regions.length)
//           .map(item => {
//             const newItem = _.cloneDeep(item)
//             newItem.group_title = 'Undefined'
//             newItem.categories = []
//             return newItem
//           })
//         for (const region of regions) {
//           let filtered = items
//             .filter(item => {
//               return item.regions.map(c => c.code).includes(region.code)
//             })
//             .map(item => {
//               const newItem = _.cloneDeep(item)
//               newItem.group_title = region.name
//               return newItem
//             })
//           results = results.concat(filtered)
//         }

//         return results
//       },
//       sortBy: item => {
//         if (item.group_title === 'Undefined') return '_'
//         return item.group_title
//       }
//     }
//   )
// }
