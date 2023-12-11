import { Logger, Storage, Collection } from '@freearhey/core'
import { STREAMS_DIR, DATA_DIR } from '../../constants'
import { PlaylistParser } from '../../core'
import { Stream, Playlist, Channel } from '../../models'
import { program } from 'commander'

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

async function main() {
  const storage = new Storage(STREAMS_DIR)
  const logger = new Logger()

  logger.info('loading channels from api...')
  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  const groupedChannels = new Collection(channelsContent)
    .map(data => new Channel(data))
    .keyBy((channel: Channel) => channel.id)

  logger.info('loading streams...')
  const parser = new PlaylistParser({ storage })
  const files = program.args.length ? program.args : await storage.list('**/*.m3u')
  let streams = await parser.parse(files)

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
    if (groupedChannels.missing(stream.channel)) {
      stream.channel = ''
    }

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
  const groupedStreams = streams.groupBy((stream: Stream) => stream.filepath)
  for (let filepath of groupedStreams.keys()) {
    const streams = groupedStreams.get(filepath) || []

    if (!streams.length) return

    const playlist = new Playlist(streams, { public: false })
    await storage.save(filepath, playlist.toString())
  }
}

main()
