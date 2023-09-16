import parser from 'iptv-playlist-parser'
import { Playlist, Stream } from '../models'
import { Collection, Storage } from './'

export class PlaylistParser {
  storage: Storage

  constructor({ storage }: { storage: Storage }) {
    this.storage = storage
  }

  async parse(filepath: string): Promise<Playlist> {
    const streams = new Collection()

    const content = await this.storage.read(filepath)
    const parsed: parser.Playlist = parser.parse(content)

    parsed.items.forEach((item: parser.PlaylistItem) => {
      const { name, label, quality } = parseTitle(item.name)
      const stream = new Stream({
        channel: item.tvg.id,
        name,
        label,
        quality,
        filepath,
        line: item.line,
        url: item.url,
        httpReferrer: item.http.referrer,
        userAgent: item.http['user-agent']
      })

      streams.add(stream)
    })

    return new Playlist(streams)
  }
}

function parseTitle(title: string): { name: string; label: string; quality: string } {
  const [, label] = title.match(/ \[(.*)\]$/) || [null, '']
  const [, quality] = title.match(/ \(([0-9]+p)\)/) || [null, '']
  const name = title.replace(` (${quality})`, '').replace(` [${label}]`, '')

  return { name, label, quality }
}
