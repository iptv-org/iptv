import { Collection, File, Storage } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { PUBLIC_DIR } from '../constants'
import { Generator } from './generator'
import { EOL } from 'node:os'

type IndexGeneratorProps = {
  streams: Collection
  logFile: File
}

export class IndexGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const sfwStreams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    const playlist = new Playlist(sfwStreams, { public: true })
    const filepath = 'index.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
