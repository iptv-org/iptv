import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type CitiesGeneratorProps = {
  streams: Collection<Stream>
  cities: Collection<sdk.Models.City>
  logFile: File
}

export class CitiesGenerator implements Generator {
  streams: Collection<Stream>
  cities: Collection<sdk.Models.City>
  storage: Storage
  logFile: File

  constructor({ streams, cities, logFile }: CitiesGeneratorProps) {
    this.streams = streams.clone()
    this.cities = cities
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const streamsGroupedByCityCode = {}
    streams.forEach((stream: Stream) => {
      stream.getBroadcastCities().forEach((city: sdk.Models.City) => {
        if (streamsGroupedByCityCode[city.code]) {
          streamsGroupedByCityCode[city.code].add(stream)
        } else {
          streamsGroupedByCityCode[city.code] = new Collection<Stream>([stream])
        }
      })
    })

    for (const cityCode in streamsGroupedByCityCode) {
      const cityStreams = streamsGroupedByCityCode[cityCode]

      const playlist = new Playlist(cityStreams, { public: true })
      const filepath = `cities/${cityCode.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'city', filepath, count: playlist.streams.count() }) + EOL
      )
    }
  }
}
