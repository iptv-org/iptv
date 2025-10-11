import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type IndexCountryGeneratorProps = {
  streams: Collection<Stream>
  logFile: File
}

export class IndexCountryGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexCountryGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    let groupedStreams = new Collection<Stream>()

    this.streams
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())
      .forEach((stream: Stream) => {
        const broadcastAreaCountries = stream.getBroadcastCountries()

        if (stream.getBroadcastAreaCodes().isEmpty()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'Undefined'
          groupedStreams.add(streamClone)
          return
        }

        broadcastAreaCountries.forEach((country: sdk.Models.Country) => {
          const streamClone = stream.clone()
          streamClone.groupTitle = country.name
          groupedStreams.add(streamClone)
        })

        if (stream.isInternational()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'International'
          groupedStreams.add(streamClone)
        }
      })

    groupedStreams = groupedStreams.sortBy((stream: Stream) => {
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
