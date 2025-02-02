import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { IssueLoader, PlaylistParser } from '../../core'
import { Blocked, Channel, Issue, Stream } from '../../models'

async function main() {
  const logger = new Logger()
  const loader = new IssueLoader()

  const storage = new Storage(DATA_DIR)

  logger.info('loading channels from api...')
  const channelsContent = await storage.json('channels.json')
  const groupedChannels = new Collection(channelsContent)
    .map(data => new Channel(data))
    .groupBy((channel: Channel) => channel.id)

  logger.info('loading blocklist from api...')
  const blocklistContent = await storage.json('blocklist.json')
  const groupedBlocklist = new Collection(blocklistContent)
    .map(data => new Blocked(data))
    .groupBy((blocked: Blocked) => blocked.channel)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const groupedStreams = streams.groupBy((stream: Stream) => stream.url)

  logger.info('creating report...')
  let report = new Collection()

  logger.info('checking streams:add requests...')
  const addRequests = await loader.load({ labels: ['streams:add'] })
  const buffer = new Dictionary()
  addRequests.forEach((issue: Issue) => {
    const channelId = issue.data.get('channel_id') || undefined
    const streamUrl = issue.data.get('stream_url') || undefined

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'streams:add',
      channelId,
      status: undefined
    })

    if (!channelId) result.set('status', 'missing_id')
    else if (!streamUrl) result.set('status', 'missing_link')
    else if (groupedBlocklist.has(channelId)) result.set('status', 'blocked')
    else if (groupedChannels.missing(channelId)) result.set('status', 'invalid_id')
    else if (groupedStreams.has(streamUrl)) result.set('status', 'fullfilled')
    else if (buffer.has(streamUrl)) result.set('status', 'duplicate')
    else result.set('status', 'pending')

    buffer.set(streamUrl, true)

    report.add(result.data())
  })

  logger.info('checking streams:edit requests...')
  const editRequests = await loader.load({ labels: ['streams:edit'] })
  editRequests.forEach((issue: Issue) => {
    const channelId = issue.data.get('channel_id') || undefined
    const streamUrl = issue.data.get('stream_url') || undefined

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'streams:edit',
      channelId,
      status: undefined
    })

    if (!streamUrl) result.set('status', 'missing_link')
    else if (groupedStreams.missing(streamUrl)) result.set('status', 'invalid_link')
    else if (channelId && groupedChannels.missing(channelId)) result.set('status', 'invalid_id')
    else result.set('status', 'pending')

    report.add(result.data())
  })

  logger.info('checking broken streams reports...')
  const brokenStreamReports = await loader.load({ labels: ['broken stream'] })
  brokenStreamReports.forEach((issue: Issue) => {
    const brokenLinks = issue.data.get('broken_links') || undefined

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'broken stream',
      channelId: undefined,
      status: undefined
    })

    if (!brokenLinks) result.set('status', 'missing_link')
    else if (groupedStreams.missing(brokenLinks)) result.set('status', 'invalid_link')
    else result.set('status', 'pending')

    report.add(result.data())
  })

  report = report.orderBy(item => item.issueNumber)

  console.table(report.all())
}

main()
