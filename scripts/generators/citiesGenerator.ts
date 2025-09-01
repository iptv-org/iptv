import { City, Stream, Playlist } from '../models'
import { Collection, Storage, File } from '@freearhey/core'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type CitiesGeneratorProps = {
  streams: Collection
  cities: Collection
  logFile: File
}

export class CitiesGenerator implements Generator {
  streams: Collection
  cities: Collection
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
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    this.cities.forEach(async (city: City) => {
      const cityStreams = streams.filter((stream: Stream) => stream.isBroadcastInCity(city))

      if (cityStreams.isEmpty()) return

      const playlist = new Playlist(cityStreams, { public: true })
      const filepath = `cities/${city.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'city', filepath, count: playlist.streams.count() }) + EOL
      )
    })
  }
}
