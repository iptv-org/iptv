import { DataLoader, DataProcessor, IssueLoader, PlaylistParser } from '../../core'
import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import type { DataProcessorData } from '../../types/dataProcessor'
import { Stream, Playlist, Channel, Issue } from '../../models'
import type { DataLoaderData } from '../../types/dataLoader'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import validUrl from 'valid-url'

let processedIssues = new Collection()

async function main() {
  const logger = new Logger({ disabled: true })
  const issueLoader = new IssueLoader()

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const dataLoader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await dataLoader.load()
  const { channelsKeyById, feedsGroupedByChannelId }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    feedsGroupedByChannelId,
    channelsKeyById
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)

  logger.info('removing broken streams...')
  await removeStreams({ streams, issues })

  logger.info('edit stream description...')
  await editStreams({
    streams,
    issues,
    channelsKeyById,
    feedsGroupedByChannelId
  })

  logger.info('add new streams...')
  await addStreams({
    streams,
    issues,
    channelsKeyById,
    feedsGroupedByChannelId
  })

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (let filepath of groupedStreams.keys()) {
    let streams = groupedStreams.get(filepath) || []
    streams = streams.filter((stream: Stream) => stream.removed === false)

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }

  const output = processedIssues.map(issue_number => `closes #${issue_number}`).join(', ')
  console.log(`OUTPUT=${output}`)
}

main()

async function removeStreams({ streams, issues }: { streams: Collection; issues: Collection }) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:remove') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('brokenLinks')) return

    const brokenLinks = data.getString('brokenLinks') || ''

    let changed = false
    brokenLinks
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach(link => {
        const found: Stream = streams.first((_stream: Stream) => _stream.url === link.trim())
        if (found) {
          found.removed = true
          changed = true
        }
      })

    if (changed) processedIssues.add(issue.number)
  })
}

async function editStreams({
  streams,
  issues,
  channelsKeyById,
  feedsGroupedByChannelId
}: {
  streams: Collection
  issues: Collection
  channelsKeyById: Dictionary
  feedsGroupedByChannelId: Dictionary
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:edit') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data

    if (data.missing('streamUrl')) return

    let stream: Stream = streams.first(
      (_stream: Stream) => _stream.url === data.getString('streamUrl')
    )
    if (!stream) return

    const streamId = data.getString('streamId') || ''
    const [channelId, feedId] = streamId.split('@')

    if (channelId) {
      stream
        .setChannelId(channelId)
        .setFeedId(feedId)
        .withChannel(channelsKeyById)
        .withFeed(feedsGroupedByChannelId)
        .updateId()
        .updateName()
        .updateFilepath()
    }

    const label = data.getString('label') || ''
    const quality = data.getString('quality') || ''
    const httpUserAgent = data.getString('httpUserAgent') || ''
    const httpReferrer = data.getString('httpReferrer') || ''

    if (data.has('label')) stream.setLabel(label)
    if (data.has('quality')) stream.setQuality(quality)
    if (data.has('httpUserAgent')) stream.setUserAgent(httpUserAgent)
    if (data.has('httpReferrer')) stream.setReferrer(httpReferrer)

    processedIssues.add(issue.number)
  })
}

async function addStreams({
  streams,
  issues,
  channelsKeyById,
  feedsGroupedByChannelId
}: {
  streams: Collection
  issues: Collection
  channelsKeyById: Dictionary
  feedsGroupedByChannelId: Dictionary
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:add') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('streamId') || data.missing('streamUrl')) return
    if (streams.includes((_stream: Stream) => _stream.url === data.getString('streamUrl'))) return
    const streamUrl = data.getString('streamUrl') || ''
    if (!isUri(streamUrl)) return

    const streamId = data.getString('streamId') || ''
    const [channelId, feedId] = streamId.split('@')

    const channel: Channel = channelsKeyById.get(channelId)
    if (!channel) return

    const label = data.getString('label') || null
    const quality = data.getString('quality') || null
    const httpUserAgent = data.getString('httpUserAgent') || null
    const httpReferrer = data.getString('httpReferrer') || null

    const stream = new Stream({
      channel: channelId,
      feed: feedId,
      name: data.getString('channelName') || channel.name,
      url: streamUrl,
      user_agent: httpUserAgent,
      referrer: httpReferrer,
      quality,
      label
    })
      .withChannel(channelsKeyById)
      .withFeed(feedsGroupedByChannelId)
      .updateName()
      .updateFilepath()

    streams.add(stream)
    processedIssues.add(issue.number)
  })
}

function isUri(string: string) {
  return validUrl.isUri(encodeURI(string))
}
