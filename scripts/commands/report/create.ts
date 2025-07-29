import { DataLoader, DataProcessor, IssueLoader, PlaylistParser } from '../../core'
import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DataProcessorData } from '../../types/dataProcessor'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { DataLoaderData } from '../../types/dataLoader'
import { Issue, Stream } from '../../models'
import { isURI } from '../../utils'

async function main() {
  const logger = new Logger()
  const issueLoader = new IssueLoader()
  let report = new Collection()

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const dataLoader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await dataLoader.load()
  const {
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId,
    blocklistRecordsGroupedByChannelId
  }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const streamsGroupedByUrl = streams.groupBy((stream: Stream) => stream.url)
  const streamsGroupedByChannelId = streams.groupBy((stream: Stream) => stream.channelId)
  const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

  logger.info('checking streams:remove requests...')
  const removeRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'streams:remove')
  )
  removeRequests.forEach((issue: Issue) => {
    const streamUrls = issue.data.getArray('streamUrl') || []

    if (!streamUrls.length) {
      const result = {
        issueNumber: issue.number,
        type: 'streams:remove',
        streamId: undefined,
        streamUrl: undefined,
        status: 'missing_link'
      }

      report.add(result)
    } else {
      for (const streamUrl of streamUrls) {
        const result = {
          issueNumber: issue.number,
          type: 'streams:remove',
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
    else if (!isURI(streamUrl)) result.status = 'invalid_link'
    else if (blocklistRecordsGroupedByChannelId.has(channelId)) result.status = 'blocked'
    else if (channelsKeyById.missing(channelId)) result.status = 'wrong_id'
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
    else if (channelId && channelsKeyById.missing(channelId)) result.status = 'invalid_id'

    report.add(result)
  })

  logger.info('checking channel search requests...')
  const channelSearchRequests = issues.filter(issue =>
    issue.labels.find((label: string) => label === 'channel search')
  )
  const channelSearchRequestsBuffer = new Dictionary()
  channelSearchRequests.forEach((issue: Issue) => {
    const streamId = issue.data.getString('channelId') || ''
    const [channelId, feedId] = streamId.split('@')

    const result = {
      issueNumber: issue.number,
      type: 'channel search',
      streamId: streamId || undefined,
      streamUrl: undefined,
      status: 'pending'
    }

    if (!channelId) result.status = 'missing_id'
    else if (channelsKeyById.missing(channelId)) result.status = 'invalid_id'
    else if (channelSearchRequestsBuffer.has(streamId)) result.status = 'duplicate'
    else if (blocklistRecordsGroupedByChannelId.has(channelId)) result.status = 'blocked'
    else if (streamsGroupedById.has(streamId)) result.status = 'fulfilled'
    else if (!feedId && streamsGroupedByChannelId.has(channelId)) result.status = 'fulfilled'
    else {
      const channelData = channelsKeyById.get(channelId)
      if (channelData && channelData.isClosed) result.status = 'closed'
    }

    channelSearchRequestsBuffer.set(streamId, true)

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
