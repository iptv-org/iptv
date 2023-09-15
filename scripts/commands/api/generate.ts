import { API_DIR, DB_DIR } from '../../constants'
import { Logger, Database, Collection, Storage } from '../../core'
import { Stream } from '../../models'

async function main() {
  const logger = new Logger()

  logger.info(`loading streams...`)
  const db = new Database(DB_DIR)
  const dbStreams = await db.load('streams.db')
  const docs = await dbStreams.find({})

  const streams = new Collection(docs as any[])
    .map(data => new Stream(data))
    .orderBy((stream: Stream) => stream.channel)
    .map((stream: Stream) => stream.toJSON())

  logger.info(`found ${streams.count()} streams`)

  logger.info('saving to .api/streams.json...')
  const storage = new Storage(API_DIR)
  await storage.save('streams.json', streams.toJSON())
}

main()
