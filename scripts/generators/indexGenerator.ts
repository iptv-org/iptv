import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'

type IndexGeneratorProps = {
  streams: Collection<Stream>
  logFile: File
}

export class IndexGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const sfwStreams = this.streams
      .sortBy(stream => stream.title)
      .filter((stream: Stream) => stream.isSFW())
      .map((stream: Stream) => {
        const groupTitle = stream
          .getCategories()
          .map(category => category.name)
          .sort()
          .join(';')
        if (groupTitle) stream.groupTitle = groupTitle

        return stream
      })

    const playlist = new Playlist(sfwStreams, { public: true })
    const filepath = 'index.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
