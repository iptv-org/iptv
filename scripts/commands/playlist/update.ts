import { getStreamInfo, loadIssues, createThread } from '../../utils'
import { STREAMS_DIR, LOGS_DIR } from '../../constants'
import { Playlist, Issue, Stream } from '../../models'
import { loadData, data as apiData } from '../../api'
import { Logger, Collection } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import * as sdk from '@iptv-org/sdk'

const processedIssues = new Collection<Issue>()
const skippedIssues = new Collection<Issue>()
const logger = new Logger({ level: 5 })

let streams = new Collection<Stream>()
let cache = new Collection<Stream>()

function cacheData() {
  cache = streams.clone()
}

function resetData() {
  streams = cache
}

async function main() {
  logger.info('loading data from api...')
  await loadData()

  logger.info('loading issues...')
  const issues = await loadIssues()

  logger.info('loading streams...')
  await loadStreams()

  logger.info('processing issues...')
  await processIssues(issues)

  logger.info('saving streams...')
  await saveStreams()

  logger.info('saving logs...')
  await saveLogs()

  logger.info(
    `skipped ${skippedIssues.count()} issue(s): ${skippedIssues
      .map((issue: Issue) => `#${issue.number}`)
      .join(', ')}`
  )
  logger.info(
    `processed ${processedIssues.count()} issue(s): ${processedIssues
      .map((issue: Issue) => `#${issue.number}`)
      .join(', ')}`
  )
}

main()

async function saveLogs() {
  const logStorage = new Storage(LOGS_DIR)
  const output = processedIssues.map((issue: Issue) => `closes #${issue.number}`).join(', ')
  await logStorage.save('playlist_update.log', output)
}

async function saveStreams() {
  const streamsStorage = new Storage(STREAMS_DIR)
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of groupedStreams.keys()) {
    let filteredStreams = new Collection<Stream>(groupedStreams.get(filepath))
    filteredStreams = filteredStreams.filter((stream: Stream) => stream.removed === false)

    const playlist = new Playlist(filteredStreams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }
}

async function loadStreams() {
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')

  streams = await parser.parse(files)
  streams = streams.map((stream: Stream) => {
    stream.setGuides(apiData.guidesGroupedByStreamId.get(stream.getId()))
    return stream
  })
}

async function processIssues(issues: Collection<Issue>) {
  const requests = issues.filter((issue: Issue) => issue.labels.includes('approved')).all()

  for (const issue of requests) {
    switch (true) {
      case issue.labels.includes('streams:remove'):
        await removeStream(issue)
        break
      case issue.labels.includes('streams:edit'):
        await editStream(issue)
        break
      case issue.labels.includes('streams:add'):
        await addStream(issue)
        break
    }
  }
}

async function removeStream(issue: Issue) {
  const log = createThread(issue, 'streams/remove')
  log.start()

  const data = issue.data
  if (data.missing('stream_url')) {
    log.error('The request is missing the "Stream URL"')
    skippedIssues.add(issue)
    return
  }

  const streamUrls = data.getString('stream_url') || ''

  let changed = false
  streamUrls
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((link: string) => {
      const found: Stream = streams.first((_stream: Stream) => _stream.url === link.trim())
      if (found) {
        found.removed = true
        changed = true
        log.info(`The stream with the URL "${link}" has been removed from the playlists`)
      } else {
        log.error(`The stream with the URL "${link}" is missing from the playlists`)
      }
    })

  if (changed) {
    processedIssues.add(issue)
  } else {
    log.error('None of the URLs specified in the request were found in the playlists')
    skippedIssues.add(issue)
  }
}

async function editStream(issue: Issue) {
  const log = createThread(issue, 'streams/edit')
  log.start()

  const data = issue.data

  const streamUrl = data.getString('stream_url')

  if (!streamUrl) {
    log.error('The request is missing the "Stream URL"')
    skippedIssues.add(issue)
    return
  }

  const stream: Stream = streams.first((_stream: Stream) => _stream.url === streamUrl)
  if (!stream) {
    log.error(`The stream with the URL "${streamUrl}" is already in the playlists`)
    skippedIssues.add(issue)
    return
  }

  cacheData()

  stream.updateWithIssue(data)

  stream.setGuides(apiData.guidesGroupedByStreamId.get(stream.getId()))

  const errors = new Collection<Error>()
  errors.concat(stream.validate())
  if (errors.isNotEmpty()) {
    errors.forEach((err: Error) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  log.info('The stream description has been updated')

  processedIssues.add(issue)
}

async function addStream(issue: Issue) {
  const log = createThread(issue, 'streams/add')
  log.start()

  const data = issue.data
  if (data.missing('stream_id')) {
    log.error('The request is missing the "Stream ID"')
    skippedIssues.add(issue)
    return
  }

  const streamUrl = data.getString('stream_url')
  if (!streamUrl) {
    log.error('The request is missing the "Stream URL"')
    skippedIssues.add(issue)
    return
  }

  if (streams.includes((_stream: Stream) => _stream.url === streamUrl)) {
    log.error(`The stream with the URL "${streamUrl}" is already included in the playlists`)
    skippedIssues.add(issue)
    return
  }

  const streamId = data.getString('stream_id') || ''
  const [channelId, feedId] = streamId.split('@')

  const channel: sdk.Models.Channel | undefined = apiData.channelsKeyById.get(channelId)
  if (!channel) {
    log.error(`There is no channel with the ID "${channelId}" in the database`)
    skippedIssues.add(issue)
    return
  }

  const blocklistRecords: sdk.Models.BlocklistRecord[] | undefined =
    apiData.blocklistRecordsGroupedByChannel.get(channelId)
  if (blocklistRecords) {
    blocklistRecords.forEach((record: sdk.Models.BlocklistRecord) => {
      if (record.reason === 'dmca') {
        log.error(
          `The channel has been added to our blocklist due to the claims of the copyright holder: ${record.ref}`
        )
      } else if (record.reason === 'nsfw') {
        log.error(`The channel has been added to our blocklist due to NSFW content: ${record.ref}`)
      }
    })
    skippedIssues.add(issue)
    return
  }

  cacheData()

  const httpUserAgent = data.getString('http_user_agent') || null
  const httpReferrer = data.getString('http_referrer') || null

  let quality = data.getString('quality') || null
  if (!quality) {
    const streamInfo = await getStreamInfo(streamUrl, { httpUserAgent, httpReferrer })

    if (streamInfo) {
      const height = streamInfo?.resolution?.height

      if (height) {
        quality = `${height}p`
      }
    }
  }

  const stream = new Stream({
    channel: channelId,
    feed: feedId,
    title: channel.name,
    url: streamUrl,
    user_agent: httpUserAgent,
    referrer: httpReferrer,
    quality,
    label: data.getString('label') || ''
  })

  stream.updateTitle().updateFilepath()

  stream.setGuides(apiData.guidesGroupedByStreamId.get(stream.getId()))

  streams.add(stream)

  const errors = new Collection<Error>()
  errors.concat(stream.validate())
  if (errors.isNotEmpty()) {
    errors.forEach((err: Error) => {
      log.error(err.message)
    })
    skippedIssues.add(issue)
    resetData()
    log.info('All changes have been reverted')
    return
  }

  log.info('The stream has been added to playlists')

  processedIssues.add(issue)
}
