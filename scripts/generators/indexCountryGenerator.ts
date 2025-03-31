import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Playlist, Country } from '../models'
import { PUBLIC_DIR } from '../constants'

type IndexCountryGeneratorProps = {
  streams: Collection
  logger: Logger
}

export class IndexCountryGenerator implements Generator {
  streams: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, logger }: IndexCountryGeneratorProps) {
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
        if (!stream.hasBroadcastArea()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'Undefined'
          groupedStreams.add(streamClone)
          return
        }

        if (stream.isInternational()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'International'
          groupedStreams.add(streamClone)
        }

        stream.getBroadcastCountries().forEach((country: Country) => {
          const streamClone = stream.clone()
          streamClone.groupTitle = country.name
          groupedStreams.add(streamClone)
        })
      })

    groupedStreams = groupedStreams.orderBy((stream: Stream) => {
      if (stream.groupTitle === 'International') return 'ZZ'
      if (stream.groupTitle === 'Undefined') return 'ZZZ'

      return stream.groupTitle
    })

    const playlist = new Playlist(groupedStreams, { public: true })
    const filepath = 'index.country.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }))
  }
}
