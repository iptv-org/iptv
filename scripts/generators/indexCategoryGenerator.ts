import { Collection, Storage, File } from '@freearhey/core'
import { Stream, Playlist, Category } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type IndexCategoryGeneratorProps = {
  streams: Collection
  logFile: File
}

export class IndexCategoryGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexCategoryGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter(stream => stream.isSFW())

    let groupedStreams = new Collection()
    streams.forEach((stream: Stream) => {
      if (!stream.hasCategories()) {
        const streamClone = stream.clone()
        streamClone.groupTitle = 'Undefined'
        groupedStreams.add(streamClone)
        return
      }

      stream.getCategories().forEach((category: Category) => {
        const streamClone = stream.clone()
        streamClone.groupTitle = category.name
        groupedStreams.push(streamClone)
      })
    })

    groupedStreams = groupedStreams.orderBy(stream => {
      if (stream.groupTitle === 'Undefined') return 'ZZ'
      return stream.groupTitle
    })

    const playlist = new Playlist(groupedStreams, { public: true })
    const filepath = 'index.category.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
