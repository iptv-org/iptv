const { db, file, parser, store, logger } = require('../core')
const transliteration = require('transliteration')
const { program } = require('commander')
const _ = require('lodash')

const options = program
  .option(
    '--max-clusters <max-clusters>',
    'Set maximum number of clusters',
    parser.parseNumber,
    200
  )
  .option('--input-dir <input-dir>', 'Set path to input directory', 'channels')
  .parse(process.argv)
  .opts()

const links = []

async function main() {
  logger.info('Starting...')
  logger.info(`Number of clusters: ${options.maxClusters}`)

  await loadChannels()
  await saveToDatabase()

  logger.info('Done')
}

main()

async function loadChannels() {
  logger.info(`Loading links...`)

  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  for (const filepath of files) {
    const items = await parser.parsePlaylist(filepath)
    for (const item of items) {
      item.filepath = filepath
      links.push(item)
    }
  }
  logger.info(`Found ${links.length} links`)
}

async function saveToDatabase() {
  logger.info('Saving to the database...')

  await db.reset()
  const chunks = split(_.shuffle(links), options.maxClusters)
  for (const [i, chunk] of chunks.entries()) {
    for (const item of chunk) {
      const stream = store.create()
      stream.set('name', { title: item.name })
      stream.set('id', { id: item.tvg.id })
      stream.set('filepath', { filepath: item.filepath })
      stream.set('src_country', { filepath: item.filepath })
      stream.set('tvg_country', { tvg_country: item.tvg.country })
      stream.set('countries', { tvg_country: item.tvg.country })
      stream.set('regions', { countries: stream.get('countries') })
      stream.set('languages', { tvg_language: item.tvg.language })
      stream.set('categories', { group_title: item.group.title })
      stream.set('tvg_url', { tvg_url: item.tvg.url })
      stream.set('guides', { tvg_url: item.tvg.url })
      stream.set('logo', { logo: item.tvg.logo })
      stream.set('resolution', { title: item.name })
      stream.set('status', { title: item.name })
      stream.set('url', { url: item.url })
      stream.set('http', { http: item.http })
      stream.set('is_nsfw', { categories: stream.get('categories') })
      stream.set('is_broken', { status: stream.get('status') })
      stream.set('updated', { updated: false })
      stream.set('cluster_id', { cluster_id: i + 1 })

      if (!stream.get('id')) {
        const id = generateChannelId(stream.get('name'), stream.get('src_country'))
        stream.set('id', { id })
      }

      await db.insert(stream.data())
    }
  }
}

function split(arr, n) {
  let result = []
  for (let i = n; i > 0; i--) {
    result.push(arr.splice(0, Math.ceil(arr.length / i)))
  }
  return result
}

function generateChannelId(name, src_country) {
  if (name && src_country) {
    const slug = transliteration
      .transliterate(name)
      .replace(/\+/gi, 'Plus')
      .replace(/[^a-z\d]+/gi, '')
    const code = src_country.code.toLowerCase()

    return `${slug}.${code}`
  }

  return null
}
