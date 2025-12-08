import { IssueLoader, PlaylistParser } from '../../core'
import { Playlist, Issue, Stream } from '../../models'
import { loadData, data as apiData } from '../../api'
import { Logger, Collection } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { STREAMS_DIR } from '../../constants'
import * as sdk from '@iptv-org/sdk'
import { isURI } from '../../utils'

const processedIssues = new Collection()

async function main() {
  const logger = new Logger({ level: -999 })
  const issueLoader = new IssueLoader()

  logger.info('loading issues...')
  const issues = await issueLoader.load()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)

  logger.info('removing streams...')
  await removeStreams({ streams, issues })

  logger.info('edit stream description...')
  await editStreams({
    streams,
    issues
  })

  logger.info('add new streams...')
  await addStreams({
    streams,
    issues
  })

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of groupedStreams.keys()) {
    let streams = new Collection(groupedStreams.get(filepath))
    streams = streams.filter((stream: Stream) => stream.removed === false)

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }

  const output = processedIssues.map(issue_number => `closes #${issue_number}`).join(', ')
  console.log(`OUTPUT=${output}`)
}

main()

async function removeStreams({
  streams,
  issues
}: {
  streams: Collection<Stream>
  issues: Collection<Issue>
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:remove') && issue.labels.includes('approved')
  )

  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('stream_url')) return

    const streamUrls = data.getString('stream_url') || ''

    let changed = false
    streamUrls
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
  issues
}: {
  streams: Collection<Stream>
  issues: Collection<Issue>
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:edit') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data

    if (data.missing('stream_url')) return

    const stream: Stream = streams.first(
      (_stream: Stream) => _stream.url === data.getString('stream_url')
    )
    if (!stream) return

    const streamId = data.getString('stream_id') || ''
    const [channelId, feedId] = streamId.split('@')

    if (channelId) {
      stream.channel = channelId
      stream.feed = feedId
      stream.updateTvgId().updateTitle().updateFilepath()
    }

    stream.updateWithIssue(data)

    processedIssues.add(issue.number)
  })
}

async function addStreams({
  streams,
  issues
}: {
  streams: Collection<Stream>
  issues: Collection<Issue>
}) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:add') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('stream_id') || data.missing('stream_url')) return
    if (streams.includes((_stream: Stream) => _stream.url === data.getString('stream_url'))) return
    const streamUrl = data.getString('stream_url') || ''
    if (!isURI(streamUrl)) return

    const streamId = data.getString('stream_id') || ''
    const [channelId, feedId] = streamId.split('@')

    const channel: sdk.Models.Channel | undefined = apiData.channelsKeyById.get(channelId)
    if (!channel) return

    const label = data.getString('label') || ''
    const quality = data.getString('quality') || null
    const httpUserAgent = data.getString('http_user_agent') || null
    const httpReferrer = data.getString('http_referrer') || null

    const stream = new Stream({
      channel: channelId,
      feed: feedId,
      title: channel.name,
      url: streamUrl,
      user_agent: httpUserAgent,
      referrer: httpReferrer,
      quality
    })

    stream.label = label
    stream.updateTitle().updateFilepath()

    streams.add(stream)
    processedIssues.add(issue.number)
  })
}
