import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Playlist, Stream } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type RegionsGeneratorProps = {
  streams: Collection<Stream>
  regions: Collection<sdk.Models.Region>
  logFile: File
}

export class RegionsGenerator implements Generator {
  streams: Collection<Stream>
  regions: Collection<sdk.Models.Region>
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
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const streamsGroupedByRegionCode = {}
    streams.forEach((stream: Stream) => {
      stream.getBroadcastRegions().forEach((region: sdk.Models.Region) => {
        if (streamsGroupedByRegionCode[region.code]) {
          streamsGroupedByRegionCode[region.code].add(stream)
        } else {
          streamsGroupedByRegionCode[region.code] = new Collection<Stream>([stream])
        }
      })
    })

    for (const regionCode in streamsGroupedByRegionCode) {
      const regionStreams = streamsGroupedByRegionCode[regionCode]

      const playlist = new Playlist(regionStreams, { public: true })
      const filepath = `regions/${regionCode.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'region', filepath, count: playlist.streams.count() }) + EOL
      )
    }
  }
}
