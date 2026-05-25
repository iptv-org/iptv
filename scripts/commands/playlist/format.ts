import { Collection, Logger } from '@freearhey/core'
import { OptionValues, program } from 'commander'
import { Stream, Playlist } from '../../models'
import { Storage } from '@freearhey/storage-js'
import { STREAMS_DIR } from '../../constants'
import { PlaylistParser } from '../../core'
import { getStreamInfo } from '../../utils'
import { loadData, data } from '../../api'
import cliProgress from 'cli-progress'
import { eachLimit } from 'async'
import path from 'node:path'
import os from 'node:os'

program
  .argument('[filepath...]', 'Path to file to format')
  .option(
    '-p, --parallel <number>',
    'Batch size of streams to test concurrently',
    (value: string) => parseInt(value),
    os.cpus().length
  )
  .option('-x, --proxy <url>', 'Use the specified proxy')
  .option(
    '-t, --timeout <number>',
    'The number of milliseconds before the request will be aborted',
    (value: string) => parseInt(value),
    1000
  )
  .parse(process.argv)

const options: OptionValues = program.opts()

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  let files = program.args.length ? program.args : await streamsStorage.list('**/*.m3u')
  files = files.map((filepath: string) => path.basename(filepath))
  let streams = await parser.parse(files)
  streams = streams.map((stream: Stream) => {
    stream.setGuides(data.guidesGroupedByStreamId.get(stream.getId()))
    return stream
  })

  logger.info(`found ${streams.count()} streams`)

  logger.info('normalizing links...')
  streams = streams.map(stream => {
    stream.normalizeURL()
    return stream
  })

  logger.info('removing duplicates...')
  streams = streams.uniqBy(stream => stream.url)

  logger.info('removing wrong id...')
  streams = streams.map((stream: Stream) => {
    const channel = stream.getChannel()
    if (channel) return stream

    stream.tvgId = ''
    stream.channel = ''
    stream.feed = ''

    return stream
  })

  logger.info('adding the missing feed id...')
  streams = streams.map((stream: Stream) => {
    const feed = stream.getFeed()
    if (feed) {
      stream.feed = feed.id
      stream.tvgId = stream.getId()
    }

    return stream
  })

  logger.info('adding the missing quality...')
  const progressBar = new cliProgress.SingleBar({
    clearOnComplete: true,
    format: '[{bar}] {percentage}% | {value}/{total}'
  })
  progressBar.start(streams.count(), 0)
  await eachLimit(streams.all(), options.parallel, async (stream: Stream) => {
    progressBar.increment()
    if (stream.quality) return

    const streamInfo = await getStreamInfo(stream.url, {
      httpUserAgent: stream.user_agent,
      httpReferrer: stream.referrer,
      timeout: options.timeout,
      proxy: options.proxy
    })

    if (streamInfo) {
      const height = streamInfo?.resolution?.height

      if (height) {
        stream.quality = `${height}p`
      }
    }
  })
  progressBar.stop()

  logger.info('sorting links...')
  streams = streams.sortBy(
    [
      (stream: Stream) => stream.title,
      (stream: Stream) => stream.getVerticalResolution(),
      (stream: Stream) => stream.label,
      (stream: Stream) => stream.url
    ],
    ['asc', 'desc', 'asc', 'asc']
  )

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of groupedStreams.keys()) {
    const streams = new Collection(groupedStreams.get(filepath))

    if (streams.isEmpty()) return

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }
}

main()
