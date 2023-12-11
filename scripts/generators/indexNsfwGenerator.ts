import { Collection, Logger, Storage } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { Generator } from './generator'
import { PUBLIC_DIR } from '../constants'

type IndexNsfwGeneratorProps = {
  streams: Collection
  logger: Logger
}

export class IndexNsfwGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: IndexNsfwGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const allStreams = this.streams.orderBy((stream: Stream) => stream.getTitle())

    const playlist = new Playlist(allStreams, { public: true })
    const filepath = 'index.nsfw.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }
}
