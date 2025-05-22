import { Collection, Storage, Dictionary } from '@freearhey/core'
import parser from 'iptv-playlist-parser'
import { Stream } from '../models'

type PlaylistPareserProps = {
  storage: Storage
  feedsGroupedByChannelId: Dictionary
  channelsKeyById: Dictionary
}

export class PlaylistParser {
  storage: Storage
  feedsGroupedByChannelId: Dictionary
  channelsKeyById: Dictionary

  constructor({ storage, feedsGroupedByChannelId, channelsKeyById }: PlaylistPareserProps) {
    this.storage = storage
    this.feedsGroupedByChannelId = feedsGroupedByChannelId
    this.channelsKeyById = channelsKeyById
  }

  async parse(files: string[]): Promise<Collection> {
    let streams = new Collection()

    for (const filepath of files) {
      if (!this.storage.existsSync(filepath)) continue

      const _streams: Collection = await this.parseFile(filepath)
      streams = streams.concat(_streams)
    }

    return streams
  }

  async parseFile(filepath: string): Promise<Collection> {
    const content = await this.storage.load(filepath)
    const parsed: parser.Playlist = parser.parse(content)

    const streams = new Collection(parsed.items).map((data: parser.PlaylistItem) => {
      const stream = new Stream()
        .fromPlaylistItem(data)
        .withFeed(this.feedsGroupedByChannelId)
        .withChannel(this.channelsKeyById)
        .setFilepath(filepath)

      return stream
    })

    return streams
  }
}
