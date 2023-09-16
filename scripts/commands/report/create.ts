import { DATA_DIR } from '../../constants'
import { Collection, Dictionary, IssueLoader, Storage } from '../../core'
import { Blocked, Channel, Stream } from '../../models'

async function main() {
  const loader = new IssueLoader()

  const storage = new Storage(DATA_DIR)

  const channelsContent = await storage.json('channels.json')
  const groupedChannels = new Collection(channelsContent)
    .map(data => new Channel(data))
    .groupBy((channel: Channel) => channel.id)

  const streamsContent = await storage.json('streams.json')
  const groupedStreams = new Collection(streamsContent)
    .map(data => new Stream(data))
    .groupBy((stream: Stream) => stream.url)

  const blocklistContent = await storage.json('blocklist.json')
  const groupedBlocklist = new Collection(blocklistContent)
    .map(data => new Blocked(data))
    .groupBy((blocked: Blocked) => blocked.channel)

  const issues = await loader.load({ labels: ['streams:add'] })

  const buffer = new Dictionary()
  const report = issues.map(data => {
    const channelId = data.get('channel_id') || undefined
    const streamUrl = data.get('stream_url') || undefined

    const result = new Dictionary({
      issueNumber: data.get('issue_number'),
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
