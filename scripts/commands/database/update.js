const { db, store, parser, file, logger } = require('../../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs/cluster/load'

async function main() {
  const streams = await loadStreams()
  const results = await loadResults()
  const origins = await loadOrigins(results)

  await updateStreams(streams, results, origins)
}

main()

async function updateStreams(items = [], results = {}, origins = {}) {
  logger.info('updating streams...')

  let buffer = {}
  let updated = 0
  let removed = 0
  for (const item of items) {
    const stream = store.create(item)
    const result = results[item._id]
    if (result) {
      const status = parseStatus(result.error)
      stream.set('status', { status })

      if (result.streams.length) {
        const { width, height, bitrate } = parseMediaInfo(result.streams)
        stream.set('width', { width })
        stream.set('height', { height })
        stream.set('bitrate', { bitrate })
      }

      if (result.requests.length) {
        const origin = findOrigin(result.requests, origins)
        if (origin) {
          stream.set('url', { url: origin })
        }
      }
    }

    if (buffer[stream.get('url')]) {
      await db.streams.remove({ _id: stream.get('_id') })
      removed++
    } else if (stream.changed) {
      await db.streams.update({ _id: stream.get('_id') }, stream.data())
      buffer[stream.get('url')] = true
      updated++
    }
  }

  db.streams.compact()

  logger.info(`updated ${updated} streams`)
  logger.info(`removed ${removed} duplicates`)
  logger.info('done')
}

async function loadStreams() {
  logger.info('loading streams...')

  await db.streams.load()
  const streams = await db.streams.find({})

  logger.info(`found ${streams.length} streams`)

  return streams
}

async function loadResults() {
  logger.info('loading check results...')

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

async function loadOrigins(results = {}) {
  logger.info('loading origins...')

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

function parseMediaInfo(streams) {
  streams = streams.filter(s => s.codec_type === 'video')
  streams = _.orderBy(
    streams,
    ['height', s => (s.tags && s.tags.variant_bitrate ? parseInt(s.tags.variant_bitrate) : 0)],
    ['desc', 'desc']
  )

  const data = _.head(streams)
  if (data) {
    const bitrate = data.tags && data.tags.variant_bitrate ? parseInt(data.tags.variant_bitrate) : 0
    return { width: data.width, height: data.height, bitrate }
  }

  return {}
}

function parseStatus(error) {
  if (!error) return 'online'

  switch (error) {
    case 'Operation timed out':
      return 'timeout'
    case 'Server returned 403 Forbidden (access denied)':
      return 'blocked'
    default:
      return 'error'
  }
}
