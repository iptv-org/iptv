import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type IndexCategoryGeneratorProps = {
  streams: Collection<Stream>
  logFile: File
}

export class IndexCategoryGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexCategoryGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams.sortBy(stream => stream.title).filter(stream => stream.isSFW())

    let groupedStreams = new Collection<Stream>()
    streams.forEach((stream: Stream) => {
      const streamCategories = stream.getCategories()
      if (streamCategories.isEmpty()) {
        const streamClone = stream.clone()
        streamClone.groupTitle = 'Undefined'
        groupedStreams.add(streamClone)
        return
      }

      streamCategories.forEach((category: sdk.Models.Category) => {
        const streamClone = stream.clone()
        streamClone.groupTitle = category.name
        groupedStreams.add(streamClone)
      })
    })

    groupedStreams = groupedStreams.sortBy(stream => {
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
