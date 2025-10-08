import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Collection } from '@freearhey/core'
import { Stream, Playlist } from '../models'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type CategoriesGeneratorProps = {
  streams: Collection<Stream>
  categories: Collection<sdk.Models.Category>
  logFile: File
}

export class CategoriesGenerator implements Generator {
  streams: Collection<Stream>
  categories: Collection<sdk.Models.Category>
  storage: Storage
  logFile: File

  constructor({ streams, categories, logFile }: CategoriesGeneratorProps) {
    this.streams = streams.clone()
    this.categories = categories
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate() {
    const streams = this.streams.sortBy([(stream: Stream) => stream.title])

    this.categories.forEach(async (category: sdk.Models.Category) => {
      const categoryStreams = streams
        .filter((stream: Stream) => stream.hasCategory(category))
        .map((stream: Stream) => {
          const groupTitle = stream
            .getCategories()
            .map(category => category.name)
            .sort()
            .join(';')
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

    const undefinedStreams = streams.filter((stream: Stream) => stream.getCategories().isEmpty())
    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'categories/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'category', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
