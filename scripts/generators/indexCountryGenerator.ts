import { Collection, Storage, File } from '@freearhey/core'
import { Stream, Playlist, Country } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type IndexCountryGeneratorProps = {
  streams: Collection
  logFile: File
}

export class IndexCountryGenerator implements Generator {
  streams: Collection
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexCountryGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
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
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
