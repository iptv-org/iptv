const _ = require('lodash')
const statuses = require('../data/statuses')
const languages = require('../data/languages')
const { db, store, parser, file, logger } = require('../core')

let epgCodes = []
let streams = []
let checkResults = {}
const origins = {}
const items = []

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs'
const EPG_CODES_FILEPATH = process.env.EPG_CODES_FILEPATH || 'scripts/data/codes.json'

async function main() {
  await setUp()
  await loadDatabase()
  await removeDuplicates()
  await loadCheckResults()
  await findStreamOrigins()
  await updateStreams()
  await updateDatabase()
}

main()

async function loadDatabase() {
  logger.info('Loading database...')

  streams = await db.find({})

  logger.info(`Found ${streams.length} streams`)
}

async function removeDuplicates() {
  logger.info('Removing duplicates...')

  const before = streams.length
  streams = _.uniqBy(streams, 'id')
  const after = streams.length

  logger.info(`Removed ${before - after} links`)
}

async function loadCheckResults() {
  logger.info('Loading check results from logs/...')

  const files = await file.list(`${LOGS_PATH}/check-streams/cluster_*.log`)
  for (const filepath of files) {
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
      checkResults[result._id] = result
    }
  }

  logger.info(`Found ${Object.values(checkResults).length} results`)
}

async function findStreamOrigins() {
  logger.info('Searching for stream origins...')

  for (const { error, requests } of Object.values(checkResults)) {
    if (error || !Array.isArray(requests) || !requests.length) continue

    let origin = requests.shift()
    origin = new URL(origin.url)
    for (const request of requests) {
      const curr = new URL(request.url)
      const key = curr.href.replace(/(^\w+:|^)/, '')
      if (!origins[key] && curr.host === origin.host) {
        origins[key] = origin.href
      }
    }
  }

  logger.info(`Found ${_.uniq(Object.values(origins)).length} origins`)
}

async function updateStreams() {
  logger.info('Updating streams...')

  let updated = 0
  for (const item of streams) {
    const stream = store.create(item)
    const result = checkResults[item._id]

    if (result) {
      const { error, streams, requests } = result
      const resolution = parseResolution(streams)
      const origin = findOrigin(requests)
      let status = parseStatus(error)

      if (status) {
        const prevStatus = item.status
        if (prevStatus.code === 'not_247') // not_247 -> * = not_247
          status = item.status
        else if (prevStatus.code === 'geo_blocked') // geo_blocked -> * = geo_blocked
          status = item.status
        else if (status.code === 'geo_blocked') // * -> geo_blocked = *
          status = item.status
        else if (prevStatus.code === 'offline' && status.code === 'online') // offline -> online = not_247
          status = statuses['not_247']


        stream.set('status', { status })
        stream.set('is_broken', { status: stream.get('status') })
      }

      if (resolution) {
        stream.set('resolution', { resolution })
      }

      if (origin) {
        stream.set('url', { url: origin })
      }
    }

    if (!stream.has('logo')) {
      const logo = findLogo(stream.get('id'))
      stream.set('logo', { logo })
    }

    if (!stream.has('guides')) {
      const guides = findGuides(stream.get('id'))
      stream.set('guides', { guides })
    }

    if (!stream.has('countries') && stream.get('src_country')) {
      const countries = [stream.get('src_country')]
      stream.set('countries', { countries })
    }

    if (!stream.has('languages')) {
      const languages = findLanguages(stream.get('countries'), stream.get('src_country'))
      stream.set('languages', { languages })
    }

    if (stream.changed) {
      stream.set('updated', true)
      items.push(stream.data())
      updated++
    }
  }

  logger.info(`Updated ${updated} items`)
}

async function updateDatabase() {
  logger.info('Updating database...')

  for (const item of items) {
    await db.update({ _id: item._id }, item)
  }
  db.compact()

  logger.info('Done')
}

async function setUp() {
  try {
    const codes = await file.read(EPG_CODES_FILEPATH)
    epgCodes = JSON.parse(codes)
  } catch (err) {
    logger.error(err.message)
  }
}

function findLanguages(countries, src_country) {
  if (countries && Array.isArray(countries)) {
    let codes = countries.map(country => country.lang)
    codes = _.uniq(codes)

    return codes.map(code => languages.find(l => l.code === code)).filter(l => l)
  }

  if (src_country) {
    const code = src_country.lang
    const lang = languages.find(l => l.code === code)

    return lang ? [lang] : []
  }

  return []
}

function findOrigin(requests) {
  if (origins && Array.isArray(requests)) {
    requests = requests.map(r => r.url.replace(/(^\w+:|^)/, ''))
    for (const url of requests) {
      if (origins[url]) {
        return origins[url]
      }
    }
  }

  return null
}

function parseResolution(streams) {
  const resolution = streams
    .filter(s => s.codec_type === 'video')
    .reduce(
      (acc, curr) => {
        if (curr.height > acc.height) return { width: curr.width, height: curr.height }
        return acc
      },
      { width: 0, height: 0 }
    )

  if (resolution.width > 0 && resolution.height > 0) return resolution
  return null
}

function parseStatus(error) {
  if (error) {
    if (error.includes('timed out')) {
      return statuses['timeout']
    } else if (error.includes('403')) {
      return statuses['geo_blocked']
    }
    return statuses['offline']
  }

  return statuses['online']
}

function findLogo(id) {
  const item = epgCodes.find(i => i.tvg_id === id)
  if (item && item.logo) {
    return item.logo
  }

  return null
}

function findGuides(id) {
  const item = epgCodes.find(i => i.tvg_id === id)
  if (item && Array.isArray(item.guides)) {
    return item.guides
  }

  return []
}
