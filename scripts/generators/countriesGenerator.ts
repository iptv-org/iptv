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

type IndexEntry = {
  id: string
  filepath: string
  count: number
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

  // Helper method to eliminate playlist generation and logging duplication
  private async createPlaylistFile(id: string, streams: Collection<Stream>, filepath: string, indexArray: IndexEntry[]): Promise<void> {
    const playlist = new Playlist(streams, { public: true })
    const count = playlist.streams.count()
    
    await this.storage.save(filepath, playlist.toString())
    
    this.logFile.append(
      JSON.stringify({ type: 'country', filepath, count }) + EOL
    )

    // Track for the new master index feature
    indexArray.push({ id, filepath, count })
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const streamsGroupedByCountryCode: Record<string, Collection<Stream>> = {}
    const indexSummary: IndexEntry[] = []

    streams.forEach((stream: Stream) => {
      stream.getBroadcastCountries().forEach((country: sdk.Models.Country) => {
        if (streamsGroupedByCountryCode[country.code]) {
          streamsGroupedByCountryCode[country.code].add(stream)
        } else {
          streamsGroupedByCountryCode[country.code] = new Collection<Stream>([stream])
        }
      })
    })

    // 1. Generate standard country playlists
    for (const countryCode in streamsGroupedByCountryCode) {
      await this.createPlaylistFile(
        countryCode.toLowerCase(),
        streamsGroupedByCountryCode[countryCode],
        `countries/${countryCode.toLowerCase()}.m3u`,
        indexSummary
      )
    }

    // 2. Generate International playlist
    const internationalStreams = streams.filter((stream: Stream) => stream.isInternational())
    await this.createPlaylistFile(
      'int',
      internationalStreams,
      'countries/int.m3u',
      indexSummary
    )

    // 3. Generate Undefined playlist
    const undefinedStreams = streams.filter((stream: Stream) =>
      stream.getBroadcastAreaCodes().isEmpty()
    )
    await this.createPlaylistFile(
      'undefined',
      undefinedStreams,
      'countries/undefined.m3u',
      indexSummary
    )

    // NEW FEATURE: Save the generated master index summary as a JSON file
    await this.storage.save('countries/index.json', JSON.stringify(indexSummary, null, 2))
  }
}
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
