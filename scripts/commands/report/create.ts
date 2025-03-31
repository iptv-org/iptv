import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { IssueLoader, PlaylistParser } from '../../core'
import { Blocked, Channel, Issue, Stream, Feed } from '../../models'
import { uniqueId } from 'lodash'

async function main() {
  const logger = new Logger()
  const loader = new IssueLoader()
  let report = new Collection()

  logger.info('loading issues...')
  const issues = await loader.load()

  logger.info('loading data from api...')
  const dataStorage = new Storage(DATA_DIR)
  const channelsData = await dataStorage.json('channels.json')
  const channels = new Collection(channelsData).map(data => new Channel(data))
  const channelsGroupedById = channels.keyBy((channel: Channel) => channel.id)
  const feedsData = await dataStorage.json('feeds.json')
  const feeds = new Collection(feedsData).map(data =>
    new Feed(data).withChannel(channelsGroupedById)
  )
  const feedsGroupedByChannelId = feeds.groupBy((feed: Feed) =>
    feed.channel ? feed.channel.id : uniqueId()
  )
  const blocklistContent = await dataStorage.json('blocklist.json')
  const blocklist = new Collection(blocklistContent).map(data => new Blocked(data))
  const blocklistGroupedByChannelId = blocklist.keyBy((blocked: Blocked) => blocked.channelId)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsGroupedById,
    feedsGroupedByChannelId
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const streamsGroupedByUrl = streams.groupBy((stream: Stream) => stream.url)
  const streamsGroupedByChannelId = streams.groupBy((stream: Stream) => stream.channelId)

  logger.info('checking broken streams reports...')
  const brokenStreamReports = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'broken stream')
  )
  brokenStreamReports.forEach((issue: Issue) => {
    const brokenLinks = issue.data.getArray('brokenLinks') || []

    if (!brokenLinks.length) {
      const result = {
        issueNumber: issue.number,
        type: 'broken stream',
        streamId: undefined,
        streamUrl: undefined,
        status: 'missing_link'
      }

      report.add(result)
    } else {
      for (const streamUrl of brokenLinks) {
        const result = {
          issueNumber: issue.number,
          type: 'broken stream',
          streamId: undefined,
          streamUrl: truncate(streamUrl),
          status: 'pending'
        }

        if (streamsGroupedByUrl.missing(streamUrl)) {
          result.status = 'wrong_link'
        }

        report.add(result)
      }
    }
  })

  logger.info('checking streams:add requests...')
  const addRequests = issues.filter(issue => issue.labels.includes('streams:add'))
  const addRequestsBuffer = new Dictionary()
  addRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('streamId') || ''
    const streamUrl = issue.data.getString('streamUrl') || ''
    const [channelId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'streams:add',
      streamId: streamId || undefined,
      streamUrl: truncate(streamUrl),
      status: 'pending'
    }

    if (!channelId) result.status = 'missing_id'
    else if (!streamUrl) result.status = 'missing_link'
    else if (blocklistGroupedByChannelId.has(channelId)) result.status = 'blocked'
    else if (channelsGroupedById.missing(channelId)) result.status = 'wrong_id'
    else if (streamsGroupedByUrl.has(streamUrl)) result.status = 'on_playlist'
    else if (addRequestsBuffer.has(streamUrl)) result.status = 'duplicate'
    else result.status = 'pending'

    addRequestsBuffer.set(streamUrl, true)

    report.add(result)
  })

  logger.info('checking streams:edit requests...')
  const editRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'streams:edit')
  )
  editRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('streamId') || ''
    const streamUrl = issue.data.getString('streamUrl') || ''
    const [channelId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'streams:edit',
      streamId: streamId || undefined,
      streamUrl: truncate(streamUrl),
      status: 'pending'
    }

    if (!streamUrl) result.status = 'missing_link'
    else if (streamsGroupedByUrl.missing(streamUrl)) result.status = 'invalid_link'
    else if (channelId && channelsGroupedById.missing(channelId)) result.status = 'invalid_id'

    report.add(result)
  })

  logger.info('checking channel search requests...')
  const channelSearchRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'channel search')
  )
  const channelSearchRequestsBuffer = new Dictionary()
  channelSearchRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('channelId') || ''
    const [channelId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'channel search',
      streamId: streamId || undefined,
      streamUrl: undefined,
      status: 'pending'
    }

    if (!channelId) result.status = 'missing_id'
    else if (channelsGroupedById.missing(channelId)) result.status = 'invalid_id'
    else if (channelSearchRequestsBuffer.has(channelId)) result.status = 'duplicate'
    else if (blocklistGroupedByChannelId.has(channelId)) result.status = 'blocked'
    else if (streamsGroupedByChannelId.has(channelId)) result.status = 'fulfilled'
    else {
      const channelData = channelsGroupedById.get(channelId)
      if (channelData.length && channelData[0].closed) result.status = 'closed'
    }

    channelSearchRequestsBuffer.set(channelId, true)

    report.add(result)
  })

  report = report.orderBy(item => item.issueNumber).filter(item => item.status !== 'pending')

  console.table(report.all())
}

main()

function truncate(string: string, limit: number = 100) {
  if (!string) return string
  if (string.length < limit) return string

  return string.slice(0, limit) + '...'
}
