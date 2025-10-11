import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'
import * as sdk from '@iptv-org/sdk'

type SubdivisionsGeneratorProps = {
  streams: Collection<Stream>
  subdivisions: Collection<sdk.Models.Subdivision>
  logFile: File
}

export class SubdivisionsGenerator implements Generator {
  streams: Collection<Stream>
  subdivisions: Collection<sdk.Models.Subdivision>
  storage: Storage
  logFile: File

  constructor({ streams, subdivisions, logFile }: SubdivisionsGeneratorProps) {
    this.streams = streams.clone()
    this.subdivisions = subdivisions
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const streams = this.streams
      .sortBy((stream: Stream) => stream.title)
      .filter((stream: Stream) => stream.isSFW())

    const streamsGroupedBySubdivisionCode = {}
    streams.forEach((stream: Stream) => {
      stream.getBroadcastSubdivisions().forEach((subdivision: sdk.Models.Subdivision) => {
        if (streamsGroupedBySubdivisionCode[subdivision.code]) {
          streamsGroupedBySubdivisionCode[subdivision.code].add(stream)
        } else {
          streamsGroupedBySubdivisionCode[subdivision.code] = new Collection<Stream>([stream])
        }
      })
    })

    for (const subdivisionCode in streamsGroupedBySubdivisionCode) {
      const subdivisionStreams = streamsGroupedBySubdivisionCode[subdivisionCode]

      const playlist = new Playlist(subdivisionStreams, { public: true })
      const filepath = `subdivisions/${subdivisionCode.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'subdivision', filepath, count: playlist.streams.count() }) + EOL
      )
    }
  }
}
