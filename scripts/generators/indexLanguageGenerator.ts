import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Playlist, Language } from '../models'
import { PUBLIC_DIR } from '../constants'

type IndexLanguageGeneratorProps = {
  streams: Collection
  logger: Logger
}

export class IndexLanguageGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: IndexLanguageGeneratorProps) {
    this.streams = streams
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    let groupedStreams = new Collection()
    this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())
      .forEach((stream: Stream) => {
        if (!stream.hasLanguages()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'Undefined'
          groupedStreams.add(streamClone)
          return
        }

        stream.getLanguages().forEach((language: Language) => {
          const streamClone = stream.clone()
          streamClone.groupTitle = language.name
          groupedStreams.add(streamClone)
        })
      })

    groupedStreams = groupedStreams.orderBy((stream: Stream) => {
      if (stream.groupTitle === 'Undefined') return 'ZZ'
      return stream.groupTitle
    })

    const playlist = new Playlist(groupedStreams, { public: true })
    const filepath = 'index.language.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }))
  }
}
