import { Collection, Dictionary } from '@freearhey/core'
import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Generator } from './generator'

type SourcesGeneratorProps = {
  streams: Collection<Stream>
  logFile: File
}

export class SourcesGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: SourcesGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate() {
    const files: Dictionary<Stream[]> = this.streams.groupBy((stream: Stream) =>
      stream.getFilename()
    )

    for (const filename of files.keys()) {
      if (!filename) continue

      const streams = new Collection<Stream>(files.get(filename)).map((stream: Stream) => {
        const groupTitle = stream
          .getCategories()
          .map(category => category.name)
          .sort()
          .join(';')
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
