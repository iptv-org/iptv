import { Country, Subdivision, Stream, Playlist } from '../models'
import { Collection, Storage, File } from '@freearhey/core'
import { PUBLIC_DIR } from '../constants'
import { Generator } from './generator'
import { EOL } from 'node:os'

type SubdivisionsGeneratorProps = {
  streams: Collection
  subdivisions: Collection
  logFile: File
}

export class SubdivisionsGenerator implements Generator {
  streams: Collection
  subdivisions: Collection
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
      .orderBy((stream: Stream) => stream.getTitle())
      .filter((stream: Stream) => stream.isSFW())

    this.subdivisions.forEach(async (subdivision: Subdivision) => {
      const subdivisionStreams = streams.filter((stream: Stream) =>
        stream.isBroadcastInSubdivision(subdivision)
      )

      if (subdivisionStreams.isEmpty()) return

      const playlist = new Playlist(subdivisionStreams, { public: true })
      const filepath = `subdivisions/${subdivision.code.toLowerCase()}.m3u`
      await this.storage.save(filepath, playlist.toString())
      this.logFile.append(
        JSON.stringify({ type: 'subdivision', filepath, count: playlist.streams.count() }) + EOL
      )
    })
  }
}
