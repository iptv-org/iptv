import { DB_DIR, DATA_DIR, STREAMS_DIR } from '../../constants'
import { Database, Storage, Logger, Collection, Dictionary, IssueLoader } from '../../core'
import { Stream, Playlist, Channel } from '../../models'

let processedIssues = new Collection()
let streams: Collection
let groupedChannels: Dictionary

async function main() {
  const logger = new Logger({ disabled: true })
  const loader = new IssueLoader()

  logger.info('loading streams...')
  const db = new Database(DB_DIR)
  const docs = await db.load('streams.db')
  const dbStreams = await docs.find({})

  streams = new Collection(dbStreams as any[]).map(data => new Stream(data))

  const storage = new Storage(DATA_DIR)
  const channelsContent = await storage.json('channels.json')
  groupedChannels = new Collection(channelsContent)
    .map(data => new Channel(data))
    .keyBy((channel: Channel) => channel.id)

  logger.info('removing broken streams...')
  await removeStreams(loader)

  logger.info('edit stream description...')
  await editStreams(loader)

  logger.info('add new streams...')
  await addStreams(loader)

  logger.info('normalizing links...')
  streams = streams.map(stream => {
    stream.normalizeURL()
    return stream
  })

  logger.info('sorting links...')
  streams = streams.orderBy(
    [
      (stream: Stream) => stream.name,
      (stream: Stream) => parseInt(stream.quality.replace('p', '')),
      (stream: Stream) => stream.label,
      (stream: Stream) => stream.url
    ],
    ['asc', 'desc', 'asc', 'asc']
  )

  logger.info('saving...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const groupedStreams = streams.groupBy((stream: Stream) => stream.filepath)
  for (let filepath of groupedStreams.keys()) {
    const streams = groupedStreams.get(filepath) || []

    if (!streams.length) return

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }

  const output = processedIssues.map(issue_number => `closes #${issue_number}`).join(', ')
  console.log(`OUTPUT=${output}`)
}

main()

async function removeStreams(loader: IssueLoader) {
  const issues = await loader.load({ labels: ['streams:remove', 'approved'] })
  issues.forEach((data: Dictionary) => {
    if (data.missing('stream_url')) return

    const removed = streams.remove((_stream: Stream) => _stream.url === data.get('stream_url'))
    if (removed.notEmpty()) {
      processedIssues.add(data.get('issue_number'))
    }
  })
}

async function editStreams(loader: IssueLoader) {
  const issues = await loader.load({ labels: ['streams:edit', 'approved'] })
  issues.forEach((data: Dictionary) => {
    if (data.missing('stream_url')) return

    let stream = streams.first(
      (_stream: Stream) => _stream.url === data.get('stream_url')
    ) as Stream

    if (!stream) return

    if (data.has('channel_id')) {
      const channel = groupedChannels.get(data.get('channel_id'))

      if (!channel) return

      stream.channel = data.get('channel_id')
      stream.filepath = `${channel.country.toLowerCase()}.m3u`
      stream.line = -1
      stream.name = channel.name
    }

    if (data.has('channel_name')) stream.name = data.get('channel_name')
    if (data.has('label')) stream.label = data.get('label')
    if (data.has('quality')) stream.quality = data.get('quality')
    if (data.has('user_agent')) stream.userAgent = data.get('user_agent')
    if (data.has('http_referrer')) stream.httpReferrer = data.get('http_referrer')
    if (data.has('channel_name')) stream.name = data.get('channel_name')

    streams.remove((_stream: Stream) => _stream.channel === stream.channel)
    streams.add(stream)

    processedIssues.add(data.get('issue_number'))
  })
}

async function addStreams(loader: IssueLoader) {
  const issues = await loader.load({ labels: ['streams:add', 'approved'] })
  issues.forEach((data: Dictionary) => {
    if (data.missing('channel_id') || data.missing('stream_url')) return
    if (streams.includes((_stream: Stream) => _stream.url === data.get('stream_url'))) return

    const channel = groupedChannels.get(data.get('channel_id'))

    if (!channel) return

    const stream = new Stream({
      channel: data.get('channel_id'),
      url: data.get('stream_url'),
      label: data.get('label'),
      quality: data.get('quality'),
      userAgent: data.get('user_agent'),
      httpReferrer: data.get('http_referrer'),
      filepath: `${channel.country.toLowerCase()}.m3u`,
      line: -1,
      name: data.get('channel_name') || channel.name
    })

    streams.add(stream)
    processedIssues.add(data.get('issue_number'))
  })
}
