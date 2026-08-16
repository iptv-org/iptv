import { isURI, truncate, loadIssues, loadDiscussions } from '../../utils'
import { Logger, Collection, Dictionary } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { STREAMS_DIR } from '../../constants'
import { Discussion, Issue, Stream } from '../../models'
import { PlaylistParser } from '../../core'
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
  let report = new Collection()

  logger.info('loading issues...')
  const issues = await loadIssues()

  logger.info('loading discussions...')
  const discussions = await loadDiscussions()

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
    const streamUrls = issue.dataSet.getArray('stream_url') || []

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
    const streamId = issue.dataSet.getString('stream_id') || ''
    const streamUrl = issue.dataSet.getString('stream_url') || ''
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
    const streamId = issue.dataSet.getString('stream_id') || ''
    const streamUrl = issue.dataSet.getString('stream_url') || ''
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
  const channelSearchRequests = discussions.filter(
    (discussion: Discussion) => discussion.category === 'Channel Search'
  )

  const requestsWithFeed = new Set<string>()

  channelSearchRequests.forEach((discussion: Discussion) => {
    const streamId =
      discussion.data.getString('stream_id') || discussion.data.getString('channel_id') || ''
    const [channelId, feedId] = streamId.split('@')

    if (channelId && feedId) {
      requestsWithFeed.add(channelId)
    }
  })

  const seenStreamIds = new Set<string>()

  channelSearchRequests.forEach((discussion: Discussion) => {
    const streamId =
      discussion.data.getString('stream_id') || discussion.data.getString('channel_id') || ''
    const [channelId, feedId] = streamId.split('@')
    const channelData = channelId ? data.channelsKeyById.get(channelId) : null

    const isExactDuplicate = streamId && seenStreamIds.has(streamId)
    const overlappedByFeeds = !feedId && channelId && requestsWithFeed.has(channelId)

    const rules = [
      { status: status.MISSING_CHANNEL_ID, when: !channelId },
      { status: status.INVALID_CHANNEL_ID, when: data.channelsKeyById.missing(channelId) },
      { status: status.DUPLICATE_REQUEST, when: isExactDuplicate || overlappedByFeeds },
      {
        status: status.CHANNEL_BLOCKED,
        when: data.blocklistRecordsGroupedByChannel.has(channelId)
      },
      { status: status.FULFILLED, when: streamsGroupedById.has(streamId) },
      { status: status.FULFILLED, when: !feedId && streamsGroupedByChannel.has(channelId) },
      { status: status.CHANNEL_CLOSED, when: channelData && channelData.isClosed() }
    ]

    const matchedRule = rules.find(rule => rule.when)
    const finalStatus = matchedRule ? matchedRule.status : status.PENDING

    if (streamId) {
      seenStreamIds.add(streamId)
    }

    report.add({
      issueNumber: discussion.number,
      type: 'channel search',
      streamId: streamId || undefined,
      streamUrl: undefined,
      status: finalStatus
    })
  })

  report = report.sortBy(item => item.issueNumber).filter(item => item.status !== status.PENDING)

  console.table(report.all())
}

main()
