import { Logger, Storage } from '@freearhey/core'
import { STREAMS_DIR, DATA_DIR } from '../../constants'
import { DataLoader, DataProcessor, PlaylistParser } from '../../core'
import { Stream, Playlist } from '../../models'
import { program } from 'commander'
import { DataLoaderData } from '../../types/dataLoader'
import { DataProcessorData } from '../../types/dataProcessor'
import path from 'node:path'

program.argument('[filepath...]', 'Path to file to format').parse(process.argv)

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const { channelsKeyById, feedsGroupedByChannelId, logosGroupedByStreamId }: DataProcessorData =
    processor.process(data)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage,
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId
  })
  let files = program.args.length ? program.args : await streamsStorage.list('**/*.m3u')
  files = files.map((filepath: string) => path.basename(filepath))
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
    if (!stream.channel || channelsKeyById.missing(stream.channel.id)) {
      stream.id = ''
    }

    return stream
  })

  logger.info('sorting links...')
  streams = streams.orderBy(
    [
      (stream: Stream) => stream.title,
      (stream: Stream) => stream.getVerticalResolution(),
      (stream: Stream) => stream.getLabel(),
      (stream: Stream) => stream.url
    ],
    ['asc', 'desc', 'asc', 'asc']
  )

  logger.info('saving...')
  const groupedStreams = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of groupedStreams.keys()) {
    const streams = groupedStreams.get(filepath) || []

    if (!streams.length) return

    const playlist = new Playlist(streams, { public: false })
    await streamsStorage.save(filepath, playlist.toString())
  }
}

main()
