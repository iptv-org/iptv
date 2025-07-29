import { Collection, Storage, File } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { PUBLIC_DIR } from '../constants'
import { Generator } from './generator'
import { EOL } from 'node:os'

type RawGeneratorProps = {
  streams: Collection
  logFile: File
}

export class RawGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: RawGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate() {
    const files = this.streams.groupBy((stream: Stream) => stream.getFilename())

    for (const filename of files.keys()) {
      const streams = new Collection(files.get(filename)).map((stream: Stream) => {
        const groupTitle = stream.getCategoryNames().join(';')
        if (groupTitle) stream.groupTitle = groupTitle

        return stream
      })
      const playlist = new Playlist(streams, { public: true })
      const filepath = `raw/${filename}`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'raw', filepath, count: playlist.streams.count() }) + EOL
      )
    }
  }
}
