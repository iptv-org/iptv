import { API_DIR, STREAMS_DIR } from '../../constants'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import { Logger } from '@freearhey/core'
import { Stream } from '../../models'
import { loadData } from '../../api'

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')
  const parsed = await parser.parse(files)
  const _streams = parsed
    .sortBy((stream: Stream) => stream.getId())
    .map((stream: Stream) => stream.toObject())
  logger.info(`found ${_streams.count()} streams`)

  logger.info('saving to .api/streams.json...')
  const apiStorage = new Storage(API_DIR)
  await apiStorage.save('streams.json', _streams.toJSON())
}

main()
