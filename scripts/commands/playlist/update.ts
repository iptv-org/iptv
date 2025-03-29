import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { IssueLoader, PlaylistParser } from '../../core'
import { Stream, Playlist, Channel, Feed, Issue } from '../../models'
import validUrl from 'valid-url'
import { uniqueId } from 'lodash'

let processedIssues = new Collection()

async function main() {
  const logger = new Logger({ disabled: true })
  const loader = new IssueLoader()

  logger.info('loading issues...')
  const issues = await loader.load()

  logger.info('loading channels from api...')
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

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    feedsGroupedByChannelId,
    channelsGroupedById
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)

  logger.info('removing broken streams...')
  await removeStreams({ streams, issues })

  logger.info('edit stream description...')
  await editStreams({
    streams,
    issues,
    channelsGroupedById,
    feedsGroupedByChannelId
  })

  logger.info('add new streams...')
  await addStreams({
    streams,
    issues,
    channelsGroupedById,
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
  channelsGroupedById,
  feedsGroupedByChannelId
}: {
  streams: Collection
  issues: Collection
  channelsGroupedById: Dictionary
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
        .withChannel(channelsGroupedById)
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
    if (data.has('httpUserAgent')) stream.setHttpUserAgent(httpUserAgent)
    if (data.has('httpReferrer')) stream.setHttpReferrer(httpReferrer)

    processedIssues.add(issue.number)
  })
}

async function addStreams({
  streams,
  issues,
  channelsGroupedById,
  feedsGroupedByChannelId
}: {
  streams: Collection
  issues: Collection
  channelsGroupedById: Dictionary
  feedsGroupedByChannelId: Dictionary
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:add') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('streamId') || data.missing('streamUrl')) return
    if (streams.includes((_stream: Stream) => _stream.url === data.getString('streamUrl'))) return
    const stringUrl = data.getString('streamUrl') || ''
    if (!isUri(stringUrl)) return

    const streamId = data.getString('streamId') || ''
    const [channelId] = streamId.split('@')

    const channel: Channel = channelsGroupedById.get(channelId)
    if (!channel) return

    const label = data.getString('label') || ''
    const quality = data.getString('quality') || ''
    const httpUserAgent = data.getString('httpUserAgent') || ''
    const httpReferrer = data.getString('httpReferrer') || ''

    const stream = new Stream({
      tvg: {
        id: streamId,
        name: '',
        url: '',
        logo: '',
        rec: '',
        shift: ''
      },
      name: data.getString('channelName') || channel.name,
      url: stringUrl,
      group: {
        title: ''
      },
      http: {
        'user-agent': httpUserAgent,
        referrer: httpReferrer
      },
      line: -1,
      raw: '',
      timeshift: '',
      catchup: {
        type: '',
        source: '',
        days: ''
      }
    })
      .withChannel(channelsGroupedById)
      .withFeed(feedsGroupedByChannelId)
      .setLabel(label)
      .setQuality(quality)
      .updateName()
      .updateFilepath()

    streams.add(stream)
    processedIssues.add(issue.number)
  })
}

function isUri(string: string) {
  return validUrl.isUri(encodeURI(string))
}
