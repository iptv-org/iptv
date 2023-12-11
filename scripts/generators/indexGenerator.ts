import { Collection, Logger, Storage } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { Generator } from './generator'
import { PUBLIC_DIR } from '../constants'

type IndexGeneratorProps = {
  streams: Collection
  logger: Logger
}

export class IndexGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: IndexGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const sfwStreams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    const playlist = new Playlist(sfwStreams, { public: true })
    const filepath = 'index.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }
}
