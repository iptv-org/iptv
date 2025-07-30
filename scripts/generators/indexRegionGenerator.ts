import { Collection, Storage, File } from '@freearhey/core'
import { Stream, Playlist, Region } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type IndexRegionGeneratorProps = {
  streams: Collection
  regions: Collection
  logFile: File
}

export class IndexRegionGenerator implements Generator {
  streams: Collection
  regions: Collection
  storage: Storage
  logFile: File

  constructor({ streams, regions, logFile }: IndexRegionGeneratorProps) {
    this.streams = streams.clone()
    this.regions = regions
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    let groupedStreams = new Collection()
    this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())
      .forEach((stream: Stream) => {
        if (stream.isInternational()) {
          const streamClone = stream.clone()
          streamClone.groupTitle = 'International'
          groupedStreams.push(streamClone)
          return
        }

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
      if (stream.groupTitle === 'International') return 'ZZ'
      if (stream.groupTitle === 'Undefined') return 'ZZZ'
      return stream.groupTitle
    })

    const playlist = new Playlist(groupedStreams, { public: true })
    const filepath = 'index.region.m3u'
    await this.storage.save(filepath, playlist.toString())
    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
