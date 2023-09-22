import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Playlist, Category } from '../models'
import { PUBLIC_DIR } from '../constants'

type IndexCategoryGeneratorProps = {
  streams: Collection
  logger: Logger
}

export class IndexCategoryGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: IndexCategoryGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter(stream => stream.isSFW())

    let groupedStreams = new Collection()
    streams.forEach((stream: Stream) => {
      if (stream.noCategories()) {
        const streamClone = stream.clone()
        streamClone.groupTitle = 'Undefined'
        groupedStreams.add(streamClone)
        return
      }

      stream.categories.forEach((category: Category) => {
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
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }
}
