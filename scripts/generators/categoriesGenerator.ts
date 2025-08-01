import { Collection, Storage, File } from '@freearhey/core'
import { Stream, Category, Playlist } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type CategoriesGeneratorProps = {
  streams: Collection
  categories: Collection
  logFile: File
}

export class CategoriesGenerator implements Generator {
  streams: Collection
  categories: Collection
  storage: Storage
  logFile: File

  constructor({ streams, categories, logFile }: CategoriesGeneratorProps) {
    this.streams = streams.clone()
    this.categories = categories
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate() {
    const streams = this.streams.orderBy([(stream: Stream) => stream.getTitle()])

    this.categories.forEach(async (category: Category) => {
      const categoryStreams = streams
        .filter((stream: Stream) => stream.hasCategory(category))
        .map((stream: Stream) => {
          const groupTitle = stream.getCategoryNames().join(';')
          if (groupTitle) stream.groupTitle = groupTitle

          return stream
        })

      const playlist = new Playlist(categoryStreams, { public: true })
      const filepath = `categories/${category.id}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'category', filepath, count: playlist.streams.count() }) + EOL
      )
    })

    const undefinedStreams = streams.filter((stream: Stream) => !stream.hasCategories())
    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'categories/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'category', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
