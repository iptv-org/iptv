const _ = require('lodash')
const statuses = require('../data/statuses')
const { db, store, parser, file, logger } = require('../core')

let streams = []
let results = {}
const origins = {}
const items = []

const LOGS_PATH = process.env.LOGS_PATH || 'scripts/logs/load-streams'

async function main() {
  await loadDatabase()
  await loadResults()
  await findStreamOrigins()
  await updateStreams()
  await updateDatabase()
}

main()

async function loadDatabase() {
  logger.info('loading database...')

  streams = await db.find({})

  logger.info(`found ${streams.length} streams`)
}

async function loadResults() {
  logger.info('loading results from logs/load-streams...')

  const files = await file.list(`${LOGS_PATH}/cluster_*.log`)
  for (const filepath of files) {
    const parsed = await parser.parseLogs(filepath)
    for (const result of parsed) {
      results[result._id] = result
    }
  }

  logger.info(`found ${Object.values(results).length} results`)
}

async function findStreamOrigins() {
  logger.info('searching for stream origins...')

  for (const { error, requests } of Object.values(results)) {
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

  logger.info(`found ${_.uniq(Object.values(origins)).length} origins`)
}

async function updateStreams() {
  logger.info('updating streams...')

  let updated = 0
  for (const item of streams) {
    const stream = store.create(item)
    const result = results[item._id]

    if (result) {
      const { error, streams, requests } = result
      const resolution = parseResolution(streams)
      const origin = findOrigin(requests)
      let status = parseStatus(error)

      if (status) {
        const prevStatus = item.status
        if (prevStatus.code === 'not_247')
          // not_247 -> * = not_247
          status = item.status
        else if (prevStatus.code === 'geo_blocked')
          // geo_blocked -> * = geo_blocked
          status = item.status
        else if (status.code === 'geo_blocked')
          // * -> geo_blocked = *
          status = item.status
        else if (prevStatus.code === 'offline' && status.code === 'online')
          // offline -> online = not_247
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

    if (stream.changed) {
      stream.set('updated', true)
      items.push(stream.data())
      updated++
    }
  }

  logger.info(`updated ${updated} items`)
}

async function updateDatabase() {
  logger.info('updating database...')

  for (const item of items) {
    await db.update({ _id: item._id }, item)
  }
  db.compact()

  logger.info('done')
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
