import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Playlist, Country, Subdivision, Region } from '../models'
import { PUBLIC_DIR } from '../constants'

type IndexCountryGeneratorProps = {
  streams: Collection
  regions: Collection
  countries: Collection
  subdivisions: Collection
  logger: Logger
}

export class IndexCountryGenerator implements Generator {
  streams: Collection
  countries: Collection
  regions: Collection
  subdivisions: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, regions, countries, subdivisions, logger }: IndexCountryGeneratorProps) {
    this.streams = streams
    this.countries = countries
    this.regions = regions
    this.subdivisions = subdivisions
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    let groupedStreams = new Collection()

    this.streams
      .orderBy(stream => stream.getTitle())
      .filter(stream => stream.isSFW())
      .forEach(stream => {
        if (stream.noBroadcastArea()) {
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

        this.getStreamBroadcastCountries(stream).forEach((country: Country) => {
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
    this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
  }

  getStreamBroadcastCountries(stream: Stream) {
    const groupedRegions = this.regions.keyBy((region: Region) => region.code)
    const groupedCountries = this.countries.keyBy((country: Country) => country.code)
    const groupedSubdivisions = this.subdivisions.keyBy(
      (subdivision: Subdivision) => subdivision.code
    )

    let broadcastCountries = new Collection()

    stream.broadcastArea.forEach(broadcastAreaCode => {
      const [type, code] = broadcastAreaCode.split('/')
      switch (type) {
        case 'c':
          broadcastCountries.add(code)
          break
        case 'r':
          if (code !== 'INT' && groupedRegions.has(code)) {
            broadcastCountries = broadcastCountries.concat(groupedRegions.get(code).countries)
          }
          break
        case 's':
          if (groupedSubdivisions.has(code)) {
            broadcastCountries.add(groupedSubdivisions.get(code).country)
          }
          break
      }
    })

    return broadcastCountries
      .uniq()
      .map(code => groupedCountries.get(code))
      .filter(Boolean)
  }
}
