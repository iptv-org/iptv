import { Collection, Storage, File, type Dictionary } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type SourcesGeneratorProps = {
  streams: Collection
  logFile: File
}

export class SourcesGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: SourcesGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate() {
    const files: Dictionary = this.streams.groupBy((stream: Stream) => stream.getFilename())

    for (const filename of files.keys()) {
      if (!filename) continue

      let streams = new Collection(files.get(filename))
      streams = streams.map((stream: Stream) => {
        const groupTitle = stream.getCategoryNames().join(';')
        if (groupTitle) stream.groupTitle = groupTitle

        return stream
      })
      const playlist = new Playlist(streams, { public: true })
      const filepath = `sources/${filename}`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'source', filepath, count: playlist.streams.count() }) + EOL
      )
    }
  }
}
