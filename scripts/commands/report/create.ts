import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { Collection, Dictionary, IssueLoader, Storage, Logger, PlaylistParser } from '../../core'
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

  logger.info('loading issue from github...')
  const issues = await loader.load({ labels: ['streams:add'] })

  logger.info('creating report...')
  const buffer = new Dictionary()
  const report = issues.map((issue: Issue) => {
    const channelId = issue.data.get('channel_id') || undefined
    const streamUrl = issue.data.get('stream_url') || undefined

    const result = new Dictionary({
      issueNumber: issue.number,
      channelId,
      status: undefined
    })

    if (!channelId || !streamUrl) result.set('status', 'error')
    else if (groupedBlocklist.has(channelId)) result.set('status', 'blocked')
    else if (groupedChannels.missing(channelId)) result.set('status', 'invalid_id')
    else if (groupedStreams.has(streamUrl)) result.set('status', 'fullfilled')
    else if (buffer.has(streamUrl)) result.set('status', 'duplicate')
    else result.set('status', 'pending')

    buffer.set(streamUrl, true)

    return result.data()
  })

  console.table(report.all())
}

main()
