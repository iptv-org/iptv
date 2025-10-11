import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type CountriesGeneratorProps = {
  streams: Collection<Stream>
  countries: Collection<sdk.Models.Country>
  logFile: File
}

export class CountriesGenerator implements Generator {
  streams: Collection<Stream>
  countries: Collection<sdk.Models.Country>
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
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const streamsGroupedByCountryCode = {}
    streams.forEach((stream: Stream) => {
      stream.getBroadcastCountries().forEach((country: sdk.Models.Country) => {
        if (streamsGroupedByCountryCode[country.code]) {
          streamsGroupedByCountryCode[country.code].add(stream)
        } else {
          streamsGroupedByCountryCode[country.code] = new Collection<Stream>([stream])
        }
      })
    })

    for (const countryCode in streamsGroupedByCountryCode) {
      const countryStreams = streamsGroupedByCountryCode[countryCode]

      const playlist = new Playlist(countryStreams, { public: true })
      const filepath = `countries/${countryCode.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'country', filepath, count: playlist.streams.count() }) + EOL
      )
    }

    const internationalStreams = streams.filter((stream: Stream) => stream.isInternational())
    const internationalPlaylist = new Playlist(internationalStreams, { public: true })
    const internationalFilepath = 'countries/int.m3u'
    await this.storage.save(internationalFilepath, internationalPlaylist.toString())
    this.logFile.append(
      JSON.stringify({
        type: 'country',
        filepath: internationalFilepath,
        count: internationalPlaylist.streams.count()
      }) + EOL
    )

    const undefinedStreams = streams.filter((stream: Stream) =>
      stream.getBroadcastAreaCodes().isEmpty()
    )
    const undefinedPlaylist = new Playlist(undefinedStreams, { public: true })
    const undefinedFilepath = 'countries/undefined.m3u'
    await this.storage.save(undefinedFilepath, undefinedPlaylist.toString())
    this.logFile.append(
      JSON.stringify({
        type: 'country',
        filepath: undefinedFilepath,
        count: undefinedPlaylist.streams.count()
      }) + EOL
    )
  }
}
