import { Storage, File } from '@freearhey/storage-js'
import { PUBLIC_DIR, ROOT_DIR, EOL } from '../constants'
import { Stream, Playlist } from '../models'
import { Collection } from '@freearhey/core'
import { Generator } from './generator'

type IndexGeneratorProps = {
  streams: Collection<Stream>
  logFile: File
}

export class IndexGenerator implements Generator {
  streams: Collection<Stream>
  storage: Storage
  logFile: File

  constructor({ streams, logFile }: IndexGeneratorProps) {
    this.streams = streams.clone()
    this.storage = new Storage(PUBLIC_DIR)
    this.logFile = logFile
  }

  async generate(): Promise<void> {
    const getSortKey = (stream: Stream): string => {
      let categoryRank = 4 // Default to entertainment or other
      if (stream.hasCategory({ id: 'news', name: 'news' })) categoryRank = 1
      else if (stream.hasCategory({ id: 'sports', name: 'sports' })) categoryRank = 3

      // Very simple approximation for West vs East coast based on string matching or we could use the stream title
      let locationRank = 5
      const subdivisions = stream.getBroadcastSubdivisions().all()
      const westCoast = ['US-CA', 'US-WA', 'US-OR', 'US-NV']
      const eastCoast = ['US-ME', 'US-NH', 'US-MA', 'US-RI', 'US-CT', 'US-NY', 'US-NJ', 'US-PA', 'US-DE', 'US-MD', 'US-VA', 'US-NC', 'US-SC', 'US-GA', 'US-FL']

      const isWestCoast = subdivisions.some(s => westCoast.includes(s.code))
      const isEastCoast = subdivisions.some(s => eastCoast.includes(s.code))

      if (isWestCoast) {
        locationRank = 1
      } else if (subdivisions.length > 0) {
        locationRank = isEastCoast ? 3 : 2 // Other specific US regions in the middle
      } else {
        locationRank = 4 // No specific region
      }

      return `${categoryRank}-${locationRank}-${stream.title}`
    }

    const allStreams = this.streams
      .sortBy(getSortKey)
      .map((stream: Stream) => {
        const groupTitle = stream
          .getCategories()
          .map(category => category.name)
          .sort()
          .join(';')
        if (groupTitle) stream.groupTitle = groupTitle

        return stream
      })

    const playlist = new Playlist(allStreams, { public: true })
    const filepath = 'index.m3u'
    await this.storage.save(filepath, playlist.toString())

    const rootStorage = new Storage(ROOT_DIR)
    await rootStorage.save(filepath, playlist.toString())

    this.logFile.append(
      JSON.stringify({ type: 'index', filepath, count: playlist.streams.count() }) + EOL
    )
  }
}
