import { Logger, Storage } from '@freearhey/core'
import { API_DIR, STREAMS_DIR } from '../../constants'
import { PlaylistParser } from '../../core'
import { Stream } from '../../models'

async function main() {
  const logger = new Logger()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  let streams = await parser.parse(files)
  streams = streams
    .map(data => new Stream(data))
    .orderBy([(stream: Stream) => stream.channel, (stream: Stream) => stream.timeshift])
    .map((stream: Stream) => stream.toJSON())

  logger.info(`found ${streams.count()} streams`)

  logger.info('saving to .api/streams.json...')
  const apiStorage = new Storage(API_DIR)
  await apiStorage.save('streams.json', streams.toJSON())
}

main()
