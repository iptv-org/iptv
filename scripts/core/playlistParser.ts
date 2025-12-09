import { Storage } from '@freearhey/storage-js'
import { Collection } from '@freearhey/core'
import parser from 'iptv-playlist-parser'
import { Stream } from '../models'

type PlaylistPareserProps = {
  storage: Storage
}

export class PlaylistParser {
  storage: Storage

  constructor({ storage }: PlaylistPareserProps) {
    this.storage = storage
  }

  async parse(files: string[]): Promise<Collection<Stream>> {
    const parsed = new Collection<Stream>()

    for (const filepath of files) {
      if (!this.storage.existsSync(filepath)) continue
      const _parsed: Collection<Stream> = await this.parseFile(filepath)
      _parsed.forEach((item: Stream) => {
        parsed.add(item)
      })
    }

    return parsed
  }

  async parseFile(filepath: string): Promise<Collection<Stream>> {
    const content = await this.storage.load(filepath)
    const parsed: parser.Playlist = parser.parse(content)

    const streams = new Collection<Stream>()
    parsed.items.forEach((data: parser.PlaylistItem) => {
      const stream = Stream.fromPlaylistItem(data)
      stream.filepath = filepath

      streams.add(stream)
    })

    return streams
  }
}
