const _ = require('lodash')
const statuses = require('../data/statuses')
const { db, store, parser, file, logger } = require('../core')

const items = []

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/load-cluster'

async function main() {
  let streams = await loadStreams()
  const results = await loadResults()
  const origins = await findOrigins(results)
  streams = await updateStreams(streams, results, origins)

  await updateDatabase(streams)
}

main()

async function loadStreams() {
  logger.info('loading streams...')

  await db.streams.load()
  const streams = await db.streams.find({})

  logger.info(`found ${streams.length} streams`)

  return streams
}

async function loadResults() {
  logger.info('loading results from logs...')

  const results = {}
  const files = await file.list(`${LOGS_DIR}/cluster_*.log`)
  for (const filepath of files) {
    const parsed = await parser.parseLogs(filepath)
    for (const item of parsed) {
      results[item._id] = item
    }
  }

  logger.info(`found ${Object.values(results).length} results`)

  return results
}

async function findOrigins(results = {}) {
  logger.info('searching for stream origins...')

  const origins = {}
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

  return origins
}

async function updateStreams(items = [], results = {}, origins = {}) {
  logger.info('updating streams...')

  let updated = 0
  const output = []
  for (const item of items) {
    const stream = store.create(item)
    const result = results[item._id]

    if (result) {
      const { error, streams, requests } = result
      const resolution = parseResolution(streams)
      const origin = findOrigin(requests, origins)
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
      output.push(stream.data())
      updated++
    }
  }

  logger.info(`updated ${updated} streams`)

  return output
}

async function updateDatabase(streams = []) {
  logger.info('updating database...')

  for (const stream of streams) {
    await db.streams.update({ _id: stream._id }, stream)
  }
  db.streams.compact()

  logger.info('done')
}

function findOrigin(requests = [], origins = {}) {
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
