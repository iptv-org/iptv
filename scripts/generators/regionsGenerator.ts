import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Playlist, Subdivision, Region } from '../models'
import { PUBLIC_DIR } from '../constants'

type RegionsGeneratorProps = {
  streams: Collection
  regions: Collection
  subdivisions: Collection
  logger: Logger
}

export class RegionsGenerator implements Generator {
  streams: Collection
  regions: Collection
  subdivisions: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, regions, subdivisions, logger }: RegionsGeneratorProps) {
    this.streams = streams
    this.regions = regions
    this.subdivisions = subdivisions
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy(stream => stream.getTitle())
      .filter(stream => stream.isSFW())

    this.regions.forEach(async (region: Region) => {
      if (region.code === 'INT') return

      const regionSubdivisionsCodes = this.subdivisions
        .filter((subdivision: Subdivision) => region.countries.indexOf(subdivision.country) > -1)
        .map((subdivision: Subdivision) => `s/${subdivision.code}`)

      const regionCodes = region.countries
        .map((code: string) => `c/${code}`)
        .concat(regionSubdivisionsCodes)
        .add(`r/${region.code}`)

      const regionStreams = streams.filter(stream => stream.broadcastArea.intersects(regionCodes))

      const playlist = new Playlist(regionStreams, { public: true })
      const filepath = `regions/${region.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logger.info(JSON.stringify({ filepath, count: playlist.streams.count() }))
    })
  }
}
