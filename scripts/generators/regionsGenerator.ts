import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Playlist, Region, Stream } from '../models'
import { PUBLIC_DIR } from '../constants'

type RegionsGeneratorProps = {
  streams: Collection
  regions: Collection
  logger: Logger
}

export class RegionsGenerator implements Generator {
  streams: Collection
  regions: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, regions, logger }: RegionsGeneratorProps) {
    this.streams = streams
    this.regions = regions
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    this.regions.forEach(async (region: Region) => {
      if (region.isWorldwide()) return

      const regionStreams = streams.filter((stream: Stream) => stream.isBroadcastInRegion(region))

      const playlist = new Playlist(regionStreams, { public: true })
      const filepath = `regions/${region.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logger.info(
        JSON.stringify({ type: 'region', filepath, count: playlist.streams.count() })
      )
    })

    const internationalStreams = streams.filter((stream: Stream) => stream.isInternational())
    const internationalPlaylist = new Playlist(internationalStreams, { public: true })
    const internationalFilepath = 'regions/int.m3u'
    await this.storage.save(internationalFilepath, internationalPlaylist.toString())
    this.logger.info(
      JSON.stringify({
        type: 'region',
        filepath: internationalFilepath,
        count: internationalPlaylist.streams.count()
      })
    )

    const undefinedStreams = streams.filter((stream: Stream) => !stream.hasBroadcastArea())
    const playlist = new Playlist(undefinedStreams, { public: true })
    const filepath = 'regions/undefined.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ type: 'region', filepath, count: playlist.streams.count() }))
  }
}
