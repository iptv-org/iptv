import { Collection, File, Storage } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type IndexNsfwGeneratorProps = {
  streams: Collection
  logFile: File
}

export class IndexNsfwGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexNsfwGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const allStreams = this.streams.orderBy((stream: Stream) => stream.getTitle())

    const playlist = new Playlist(allStreams, { public: true })
    const filepath = 'index.nsfw.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
