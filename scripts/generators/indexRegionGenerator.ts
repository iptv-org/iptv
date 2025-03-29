import { Generator } from './generator'
import { Collection, Storage, Logger } from '@freearhey/core'
import { Stream, Playlist, Region } from '../models'
import { PUBLIC_DIR } from '../constants'

type IndexRegionGeneratorProps = {
  streams: Collection
  regions: Collection
  logger: Logger
}

export class IndexRegionGenerator implements Generator {
  streams: Collection
  regions: Collection
  storage: Storage
  logger: Logger

  constructor({ streams, regions, logger }: IndexRegionGeneratorProps) {
    this.streams = streams
    this.regions = regions
    this.storage = new Storage(PUBLIC_DIR)
    this.logger = logger
  }

  async generate(): Promise<void> {
    let groupedStreams = new Collection()
    this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())
      .forEach((stream: Stream) => {
        if (!stream.hasBroadcastArea()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'Undefined'
          groupedStreams.push(streamClone)
          return
        }

        stream.getBroadcastRegions().forEach((region: Region) => {
          const streamClone = stream.clone()
          streamClone.groupTitle = region.name
          groupedStreams.push(streamClone)
        })
      })

    groupedStreams = groupedStreams.orderBy((stream: Stream) => {
      if (stream.groupTitle === 'Undefined') return 'ZZ'
      return stream.groupTitle
    })

    const playlist = new Playlist(groupedStreams, { public: true })
    const filepath = 'index.region.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logger.info(JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }))
  }
}
