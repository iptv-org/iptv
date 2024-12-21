import { Collection, Storage } from '@freearhey/core'
import parser from 'iptv-playlist-parser'
import { Stream } from '../models'
import path from 'path'
import { STREAMS_DIR } from '../constants'

export class PlaylistParser {
  storage: Storage

  constructor({ storage }: { storage: Storage }) {
    this.storage = storage
  }

  async parse(files: string[]): Promise<Collection> {
    let streams = new Collection()

    for (const filepath of files) {
      const relativeFilepath = filepath.replace(path.normalize(STREAMS_DIR), '')
      const _streams: Collection = await this.parseFile(relativeFilepath)
      streams = streams.concat(_streams)
    }

    return streams
  }

  async parseFile(filepath: string): Promise<Collection> {
    const streams = new Collection()

    const content = await this.storage.load(filepath)
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
        userAgent: item.http['user-agent'],
        timeshift: item.tvg.shift
      })

      streams.add(stream)
    })

    return streams
  }
}

function parseTitle(title: string): { name: string; label: string; quality: string } {
  const [, label] = title.match(/ \[(.*)\]$/) || [null, '']
  title = title.replace(new RegExp(` \\[${escapeRegExp(label)}\\]$`), '')
  const [, quality] = title.match(/ \(([0-9]+p)\)$/) || [null, '']
  title = title.replace(new RegExp(` \\(${quality}\\)$`), '')

  return { name: title, label, quality }
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}
