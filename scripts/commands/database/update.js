const { db, store, parser, file, logger } = require('../../core')
const statuses = require('../../data/statuses')
const _ = require('lodash')

const items = []

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/cluster/load'

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

      const { is_online } = parseError(error)
      stream.set('is_online', { is_online })

      if (streams.length) {
        const { width, height, bitrate } = parseStreams(streams)
        stream.set('width', { width })
        stream.set('height', { height })
        stream.set('bitrate', { bitrate })
      }

      if (requests.length) {
        const origin = findOrigin(requests, origins)
        if (origin) {
          stream.set('url', { url: origin })
        }
      }
    }

    output.push(stream.data())
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

function parseStreams(streams) {
  const data = streams
    .filter(s => s.codec_type === 'video')
    .reduce(
      (acc, curr) => {
        if (curr.height > acc.height)
          return { width: curr.width, height: curr.height, bitrate: curr.bitrate }
        return acc
      },
      { width: 0, height: 0, bitrate: 0 }
    )

  return data
}

function parseError(error) {
  const output = {
    is_online: true,
    message: error
  }

  if (error && !error.includes('403')) {
    output.is_online = false
  }

  return output
}
