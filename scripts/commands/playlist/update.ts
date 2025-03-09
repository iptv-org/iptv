import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DATA_DIR, STREAMS_DIR } from '../../constants'
import { IssueLoader, PlaylistParser } from '../../core'
import { Stream, Playlist, Channel, Issue } from '../../models'
import validUrl from 'valid-url'

let processedIssues = new Collection()
let streams: Collection
let groupedChannels: Dictionary
let issues: Collection

async function main() {
  const logger = new Logger({ disabled: true })
  const loader = new IssueLoader()

  logger.info('loading issues...')
  issues = await loader.load()

  logger.info('loading channels from api...')
  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  groupedChannels = new Collection(channelsContent)
    .map(data => new Channel(data))
    .keyBy((channel: Channel) => channel.id)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  streams = await parser.parse(files)

  logger.info('removing broken streams...')
  await removeStreams(loader)

  logger.info('edit stream description...')
  await editStreams(loader)

  logger.info('add new streams...')
  await addStreams(loader)

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.filepath)
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

async function removeStreams(loader: IssueLoader) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:remove') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('brokenLinks')) return

    const brokenLinks = data.getString('brokenLinks').split(/\r?\n/).filter(Boolean)

    let changed = false
    brokenLinks.forEach(link => {
      const found: Stream = streams.first((_stream: Stream) => _stream.url === link.trim())
      if (found) {
        found.removed = true
        changed = true
      }
    })

    if (changed) processedIssues.add(issue.number)
  })
}

async function editStreams(loader: IssueLoader) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:edit') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data

    if (data.missing('streamUrl')) return

    let stream = streams.first(
      (_stream: Stream) => _stream.url === data.getString('streamUrl')
    ) as Stream

    if (!stream) return

    if (data.has('channelId')) {
      const channel = groupedChannels.get(data.getString('channelId'))

      if (!channel) return

      stream.channel = data.getString('channelId')
      stream.filepath = `${channel.country.toLowerCase()}.m3u`
      stream.line = -1
      stream.name = channel.name
    }

    if (data.has('label')) stream.label = data.getString('label')
    if (data.has('quality')) stream.quality = data.getString('quality')
    if (data.has('httpUserAgent')) stream.httpUserAgent = data.getString('httpUserAgent')
    if (data.has('httpReferrer')) stream.httpReferrer = data.getString('httpReferrer')

    processedIssues.add(issue.number)
  })
}

async function addStreams(loader: IssueLoader) {
  const requests = issues.filter(
    issue => issue.labels.includes('streams:add') && issue.labels.includes('approved')
  )
  requests.forEach((issue: Issue) => {
    const data = issue.data
    if (data.missing('channelId') || data.missing('streamUrl')) return
    if (streams.includes((_stream: Stream) => _stream.url === data.getString('streamUrl'))) return
    if (!validUrl.isUri(data.getString('streamUrl'))) return

    const channel = groupedChannels.get(data.getString('channelId'))

    if (!channel) return

    const stream = new Stream({
      channel: data.getString('channelId'),
      url: data.getString('streamUrl'),
      label: data.getString('label'),
      quality: data.getString('quality'),
      httpUserAgent: data.getString('httpUserAgent'),
      httpReferrer: data.getString('httpReferrer'),
      filepath: `${channel.country.toLowerCase()}.m3u`,
      line: -1,
      name: data.getString('channelName') || channel.name
    })

    streams.add(stream)
    processedIssues.add(issue.number)
  })
}
