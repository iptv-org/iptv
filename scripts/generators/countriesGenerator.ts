import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Country, Subdivision, Stream, Playlist } from '../models'
import { PUBLIC_DIR } from '../constants'

type CountriesGeneratorProps = {
  streams: Collection
  countries: Collection
  logger: Logger
}

export class CountriesGenerator implements Generator {
  streams: Collection
  countries: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, countries, logger }: CountriesGeneratorProps) {
    this.streams = streams
    this.countries = countries
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
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
      this.logger.info(
        JSON.stringify({ type: 'country', filepath, count: playlist.streams.count() })
      )

      country.getSubdivisions().forEach(async (subdivision: Subdivision) => {
        const subdivisionStreams = streams.filter((stream: Stream) =>
          stream.isBroadcastInSubdivision(subdivision)
        )

        if (subdivisionStreams.isEmpty()) return

        const playlist = new Playlist(subdivisionStreams, { public: true })
        const filepath = `subdivisions/${subdivision.code.toLowerCase()}.m3u`
        await this.storage.save(filepath, playlist.toString())
        this.logger.info(
          JSON.stringify({ type: 'subdivision', filepath, count: playlist.streams.count() })
        )
      })
    })

    const undefinedStreams = streams.filter((stream: Stream) => !stream.hasBroadcastArea())
    const undefinedPlaylist = new Playlist(undefinedStreams, { public: true })
    const undefinedFilepath = 'countries/undefined.m3u'
    await this.storage.save(undefinedFilepath, undefinedPlaylist.toString())
    this.logger.info(
      JSON.stringify({
        type: 'country',
        filepath: undefinedFilepath,
        count: undefinedPlaylist.streams.count()
      })
    )
  }
}
