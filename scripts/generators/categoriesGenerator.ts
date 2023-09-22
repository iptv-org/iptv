import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Category, Playlist } from '../models'
import { PUBLIC_DIR } from '../constants'

type CategoriesGeneratorProps = {
  streams: Collection
  categories: Collection
  logger: Logger
}

export class CategoriesGenerator implements Generator {
  streams: Collection
  categories: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, categories, logger }: CategoriesGeneratorProps) {
    this.streams = streams
    this.categories = categories
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate() {
    const streams = this.streams.orderBy([(stream: Stream) => stream.getTitle()])

    this.categories.forEach(async (category: Category) => {
      const categoryStreams = streams
        .filter((stream: Stream) => stream.hasCategory(category))
        .map((stream: Stream) => {
          const streamCategories = stream.categories
            .map((category: Category) => category.name)
            .sort()
          const groupTitle = stream.categories ? streamCategories.join(';') : ''
          stream.groupTitle = groupTitle

          return stream
        })

      const playlist = new Playlist(categoryStreams, { public: true })
      const filepath = `categories/${category.id}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
    })

    const undefinedStreams = streams.filter((stream: Stream) => stream.noCategories())
    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'categories/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }
}
