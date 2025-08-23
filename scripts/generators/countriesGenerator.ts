import { Country, Stream, Playlist } from '../models'
import { Collection, Storage, File } from '@freearhey/core'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type CountriesGeneratorProps = {
  streams: Collection
  countries: Collection
  logFile: File
}

export class CountriesGenerator implements Generator {
  streams: Collection
  countries: Collection
  storage: Storage
  logFile: File

  constructor({ streams, countries, logFile }: CountriesGeneratorProps) {
    this.streams = streams.clone()
    this.countries = countries
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    this.countries.forEach(async (country: Country) => {
      const countryStreams = streams.filter((stream: Stream) =>
        stream.isBroadcastInCountry(country)
      )
      if (countryStreams.isEmpty()) return

      const playlist = new Playlist(countryStreams, { public: true })
      const filepath = `countries/${country.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'country', filepath, count: playlist.streams.count() }) + EOL
      )
    })
  }
}
