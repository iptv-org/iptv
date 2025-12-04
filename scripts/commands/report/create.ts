import { Logger, Collection, Dictionary } from '@freearhey/core'
import { IssueLoader, PlaylistParser } from '../../core'
import { Storage } from '@freearhey/storage-js'
import { isURI, truncate } from '../../utils'
import { STREAMS_DIR } from '../../constants'
import { Issue, Stream } from '../../models'
import { data, loadData } from '../../api'

const status = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  MISSING_CHANNEL_ID: 'missing_channel_id',
  INVALID_CHANNEL_ID: 'invalid_channel_id',
  MISSING_STREAM_URL: 'missing_stream_url',
  INVALID_STREAM_URL: 'invalid_stream_url',
  NONEXISTENT_LINK: 'nonexistent_link',
  CHANNEL_BLOCKED: 'channel_blocked',
  CHANNEL_CLOSED: 'channel_closed',
  DUPLICATE_LINK: 'duplicate_link',
  DUPLICATE_REQUEST: 'duplicate_request'
}

async function main() {
  const logger = new Logger()
  const issueLoader = new IssueLoader()
  let report = new Collection()

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const streamsGroupedByUrl = streams.groupBy((stream: Stream) => stream.url)
  const streamsGroupedByChannel = streams.groupBy((stream: Stream) => stream.channel)
  const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

  logger.info('checking streams:remove requests...')
  const removeRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'streams:remove')
  )
  removeRequests.forEach((issue: Issue) => {
    const streamUrls = issue.data.getArray('stream_url') || []

    if (!streamUrls.length) {
      const result = {
        issueNumber: issue.number,
        type: 'streams:remove',
        streamId: undefined,
        streamUrl: undefined,
        status: status.NONEXISTENT_LINK
      }

      report.add(result)
    } else {
      for (const streamUrl of streamUrls) {
        const result = {
          issueNumber: issue.number,
          type: 'streams:remove',
          streamId: undefined,
          streamUrl: truncate(streamUrl),
          status: status.PENDING
        }

        if (streamsGroupedByUrl.missing(streamUrl)) {
          result.status = status.NONEXISTENT_LINK
        }

        report.add(result)
      }
    }
  })

  logger.info('checking streams:add requests...')
  const addRequests = issues.filter(issue => issue.labels.includes('streams:add'))
  const addRequestsBuffer = new Dictionary()
  addRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('stream_id') || ''
    const streamUrl = issue.data.getString('stream_url') || ''
    const [channelId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'streams:add',
      streamId: streamId || undefined,
      streamUrl: truncate(streamUrl),
      status: status.PENDING
    }

    if (!channelId) result.status = status.MISSING_CHANNEL_ID
    else if (!streamUrl) result.status = status.MISSING_STREAM_URL
    else if (!isURI(streamUrl)) result.status = status.INVALID_STREAM_URL
    else if (data.blocklistRecordsGroupedByChannel.has(channelId))
      result.status = status.CHANNEL_BLOCKED
    else if (data.channelsKeyById.missing(channelId)) result.status = status.INVALID_CHANNEL_ID
    else if (streamsGroupedByUrl.has(streamUrl)) result.status = status.DUPLICATE_LINK
    else if (addRequestsBuffer.has(streamUrl)) result.status = status.DUPLICATE_REQUEST
    else result.status = status.PENDING

    addRequestsBuffer.set(streamUrl, true)

    report.add(result)
  })

  logger.info('checking streams:edit requests...')
  const editRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'streams:edit')
  )
  editRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('stream_id') || ''
    const streamUrl = issue.data.getString('stream_url') || ''
    const [channelId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'streams:edit',
      streamId: streamId || undefined,
      streamUrl: truncate(streamUrl),
      status: status.PENDING
    }

    if (!streamUrl) result.status = status.MISSING_STREAM_URL
    else if (streamsGroupedByUrl.missing(streamUrl)) result.status = status.NONEXISTENT_LINK
    else if (channelId && data.channelsKeyById.missing(channelId))
      result.status = status.INVALID_CHANNEL_ID

    report.add(result)
  })

  logger.info('checking channel search requests...')
  const channelSearchRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'channel search')
  )
  const channelSearchRequestsBuffer = new Dictionary()
  channelSearchRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('stream_id') || issue.data.getString('channel_id') || ''
    const [channelId, feedId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'channel search',
      streamId: streamId || undefined,
      streamUrl: undefined,
      status: status.PENDING
    }

    if (!channelId) result.status = status.MISSING_CHANNEL_ID
    else if (data.channelsKeyById.missing(channelId)) result.status = status.INVALID_CHANNEL_ID
    else if (channelSearchRequestsBuffer.has(streamId)) result.status = status.DUPLICATE_REQUEST
    else if (data.blocklistRecordsGroupedByChannel.has(channelId))
      result.status = status.CHANNEL_BLOCKED
    else if (streamsGroupedById.has(streamId)) result.status = status.FULFILLED
    else if (!feedId && streamsGroupedByChannel.has(channelId)) result.status = status.FULFILLED
    else {
      const channelData = data.channelsKeyById.get(channelId)
      if (channelData && channelData.isClosed()) result.status = status.CHANNEL_CLOSED
    }

    channelSearchRequestsBuffer.set(streamId, true)

    report.add(result)
  })

  report = report.sortBy(item => item.issueNumber).filter(item => item.status !== status.PENDING)

  console.table(report.all())
}

main()
