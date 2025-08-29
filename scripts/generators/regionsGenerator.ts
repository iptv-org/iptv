import { Collection, Storage, File } from '@freearhey/core'
import { Playlist, Region, Stream } from '../models'
import { PUBLIC_DIR, EOL } from '../constants'
import { Generator } from './generator'

type RegionsGeneratorProps = {
  streams: Collection
  regions: Collection
  logFile: File
}

export class RegionsGenerator implements Generator {
  streams: Collection
  regions: Collection
  storage: Storage
  logFile: File

  constructor({ streams, regions, logFile }: RegionsGeneratorProps) {
    this.streams = streams.clone()
    this.regions = regions
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    this.regions.forEach(async (region: Region) => {
      const regionStreams = streams.filter((stream: Stream) => stream.isBroadcastInRegion(region))

      const playlist = new Playlist(regionStreams, { public: true })
      const filepath = `regions/${region.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'region', filepath, count: playlist.streams.count() }) + EOL
      )
    })
  }
}
