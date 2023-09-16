import { Storage, Logger, PlaylistParser, Collection, Database } from '../../core'
import { Stream, Playlist } from '../../models'
import { STREAMS_DIR, DB_DIR } from '../../constants'

async function main() {
  const logger = new Logger()

  logger.info(`looking for streams...`)
  const storage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage
  })
  const files = await storage.list(`**/*.m3u`)
  let streams = new Collection()
  for (let filepath of files) {
    const playlist: Playlist = await parser.parse(filepath)
    streams = streams.concat(playlist.streams)
  }

  logger.info(`found ${streams.count()} streams`)

  logger.info('clean up the storage...')
  const dbStorage = new Storage(DB_DIR)
  await dbStorage.clear('streams.db')

  logger.info('saving streams to the database...')
  const db = new Database(DB_DIR)
  const dbStreams = await db.load('streams.db')
  const data = streams.map((stream: Stream) => stream.data()).all()
  await dbStreams.insert(data)
}

main()
