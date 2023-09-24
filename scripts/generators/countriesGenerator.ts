import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Country, Region, Subdivision, Stream, Playlist } from '../models'
import { PUBLIC_DIR } from '../constants'

type CountriesGeneratorProps = {
  streams: Collection
  regions: Collection
  subdivisions: Collection
  countries: Collection
  logger: Logger
}

export class CountriesGenerator implements Generator {
  streams: Collection
  countries: Collection
  regions: Collection
  subdivisions: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, countries, regions, subdivisions, logger }: CountriesGeneratorProps) {
    this.streams = streams
    this.countries = countries
    this.regions = regions
    this.subdivisions = subdivisions
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy([stream => stream.getTitle()])
      .filter((stream: Stream) => stream.isSFW())
    const regions = this.regions.filter((region: Region) => region.code !== 'INT')

    this.countries.forEach(async (country: Country) => {
      const countrySubdivisions = this.subdivisions.filter(
        (subdivision: Subdivision) => subdivision.country === country.code
      )

      const countrySubdivisionsCodes = countrySubdivisions.map(
        (subdivision: Subdivision) => `s/${subdivision.code}`
      )

      const countryAreaCodes = regions
        .filter((region: Region) => region.countries.includes(country.code))
        .map((region: Region) => `r/${region.code}`)
        .concat(countrySubdivisionsCodes)
        .add(`c/${country.code}`)

      const countryStreams = streams.filter(stream =>
        stream.broadcastArea.intersects(countryAreaCodes)
      )

      if (countryStreams.isEmpty()) return

      const playlist = new Playlist(countryStreams, { public: true })
      const filepath = `countries/${country.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))

      countrySubdivisions.forEach(async (subdivision: Subdivision) => {
        const subdivisionStreams = streams.filter(stream =>
          stream.broadcastArea.includes(`s/${subdivision.code}`)
        )

        if (subdivisionStreams.isEmpty()) return

        const playlist = new Playlist(subdivisionStreams, { public: true })
        const filepath = `subdivisions/${subdivision.code.toLowerCase()}.m3u`
        await this.storage.save(filepath, playlist.toString())
        this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
      })
    })

    const internationalStreams = streams.filter(stream => stream.isInternational())
    if (internationalStreams.notEmpty()) {
      const playlist = new Playlist(internationalStreams, { public: true })
      const filepath = 'countries/int.m3u'
      await this.storage.save(filepath, playlist.toString())
      this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
    }
  }
}
