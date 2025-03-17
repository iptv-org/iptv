import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { IssueLoader, PlaylistParser } from '../../core'
import { Blocked, Channel, Issue, Stream } from '../../models'

async function main() {
  const logger = new Logger()
  const loader = new IssueLoader()

  const storage = new Storage(DATA_DIR)

  logger.info('loading issues...')
  const issues = await loader.load()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const streamsGroupedByUrl = streams.groupBy((stream: Stream) => stream.url)
  const streamsGroupedByChannel = streams.groupBy((stream: Stream) => stream.channel)

  logger.info('loading channels from api...')
  const channelsContent = await storage.json('channels.json')
  const channelsGroupedById = new Collection(channelsContent)
    .map(data => new Channel(data))
    .groupBy((channel: Channel) => channel.id)

  logger.info('loading blocklist from api...')
  const blocklistContent = await storage.json('blocklist.json')
  const blocklistGroupedByChannel = new Collection(blocklistContent)
    .map(data => new Blocked(data))
    .groupBy((blocked: Blocked) => blocked.channel)

  let report = new Collection()

  logger.info('checking streams:add requests...')
  const addRequests = issues.filter(issue => issue.labels.includes('streams:add'))
  const addRequestsBuffer = new Dictionary()
  addRequests.forEach((issue: Issue) => {
    const channelId = issue.data.getString('channelId') || undefined
    const streamUrl = issue.data.getString('streamUrl')

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'streams:add',
      channelId,
      streamUrl,
      status: 'pending'
    })

    if (!channelId) result.set('status', 'missing_id')
    else if (!streamUrl) result.set('status', 'missing_link')
    else if (blocklistGroupedByChannel.has(channelId)) result.set('status', 'blocked')
    else if (channelsGroupedById.missing(channelId)) result.set('status', 'wrong_id')
    else if (streamsGroupedByUrl.has(streamUrl)) result.set('status', 'on_playlist')
    else if (addRequestsBuffer.has(streamUrl)) result.set('status', 'duplicate')
    else result.set('status', 'pending')

    addRequestsBuffer.set(streamUrl, true)

    report.add(result.data())
  })

  logger.info('checking streams:edit requests...')
  const editRequests = issues.filter(issue => issue.labels.find(label => label === 'streams:edit'))
  editRequests.forEach((issue: Issue) => {
    const channelId = issue.data.getString('channelId') || undefined
    const streamUrl = issue.data.getString('streamUrl') || undefined

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'streams:edit',
      channelId,
      streamUrl,
      status: 'pending'
    })

    if (!streamUrl) result.set('status', 'missing_link')
    else if (streamsGroupedByUrl.missing(streamUrl)) result.set('status', 'invalid_link')
    else if (channelId && channelsGroupedById.missing(channelId)) result.set('status', 'invalid_id')

    report.add(result.data())
  })

  logger.info('checking broken streams reports...')
  const brokenStreamReports = issues.filter(issue =>
    issue.labels.find(label => label === 'broken stream')
  )
  brokenStreamReports.forEach((issue: Issue) => {
    const brokenLinks = issue.data.getArray('brokenLinks') || []

    if (!brokenLinks.length) {
      const result = new Dictionary({
        issueNumber: issue.number,
        type: 'broken stream',
        channelId: undefined,
        streamUrl: undefined,
        status: 'missing_link'
      })

      report.add(result.data())
    } else {
      for (const streamUrl of brokenLinks) {
        const result = new Dictionary({
          issueNumber: issue.number,
          type: 'broken stream',
          channelId: undefined,
          streamUrl: undefined,
          status: 'pending'
        })

        if (streamsGroupedByUrl.missing(streamUrl)) {
          result.set('streamUrl', streamUrl)
          result.set('status', 'wrong_link')
        }

        report.add(result.data())
      }
    }
  })

  logger.info('checking channel search requests...')
  const channelSearchRequests = issues.filter(issue =>
    issue.labels.find(label => label === 'channel search')
  )
  const channelSearchRequestsBuffer = new Dictionary()
  channelSearchRequests.forEach((issue: Issue) => {
    const channelId = issue.data.getString('channelId')

    const result = new Dictionary({
      issueNumber: issue.number,
      type: 'channel search',
      channelId,
      streamUrl: undefined,
      status: 'pending'
    })

    if (!channelId) result.set('status', 'missing_id')
    else if (channelsGroupedById.missing(channelId)) result.set('status', 'invalid_id')
    else if (channelSearchRequestsBuffer.has(channelId)) result.set('status', 'duplicate')
    else if (blocklistGroupedByChannel.has(channelId)) result.set('status', 'blocked')
    else if (streamsGroupedByChannel.has(channelId)) result.set('status', 'fulfilled')
    else {
      const channelData = channelsGroupedById.get(channelId)
      if (channelData.length && channelData[0].closed) result.set('status', 'closed')
    }

    channelSearchRequestsBuffer.set(channelId, true)

    report.add(result.data())
  })

  report = report.orderBy(item => item.issueNumber).filter(item => item.status !== 'pending')

  console.table(report.all())
}

main()
