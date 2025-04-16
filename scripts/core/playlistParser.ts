import { Collection, Storage, Dictionary } from '@freearhey/core'
import parser from 'iptv-playlist-parser'
import { Stream } from '../models'

type PlaylistPareserProps = {
  storage: Storage
  feedsGroupedByChannelId: Dictionary
  channelsGroupedById: Dictionary
}

export class PlaylistParser {
  storage: Storage
  feedsGroupedByChannelId: Dictionary
  channelsGroupedById: Dictionary

  constructor({ storage, feedsGroupedByChannelId, channelsGroupedById }: PlaylistPareserProps) {
    this.storage = storage
    this.feedsGroupedByChannelId = feedsGroupedByChannelId
    this.channelsGroupedById = channelsGroupedById
  }

  async parse(files: string[]): Promise<Collection> {
    let streams = new Collection()

    for (const filepath of files) {
      const _streams: Collection = await this.parseFile(filepath)
      streams = streams.concat(_streams)
    }

    return streams
  }

  async parseFile(filepath: string): Promise<Collection> {
    const content = await this.storage.load(filepath)
    const parsed: parser.Playlist = parser.parse(content)

    const streams = new Collection(parsed.items).map((data: parser.PlaylistItem) => {
      const stream = new Stream(data)
        .withFeed(this.feedsGroupedByChannelId)
        .withChannel(this.channelsGroupedById)
        .setFilepath(filepath)

      return stream
    })

    return streams
  }
}
