import { Collection, type Dictionary } from '@freearhey/core'
import type { LogoData } from '../types/logo'
import { type Feed } from './feed'

export class Logo {
  channelId: string
  feedId?: string
  feed: Feed
  tags: Collection
  width: number
  height: number
  format?: string
  url: string

  constructor(data?: LogoData) {
    if (!data) return

    this.channelId = data.channel
    this.feedId = data.feed || undefined
    this.tags = new Collection(data.tags)
    this.width = data.width
    this.height = data.height
    this.format = data.format || undefined
    this.url = data.url
  }

  withFeed(feedsKeyById: Dictionary): this {
    if (!this.feedId) return this

    this.feed = feedsKeyById.get(this.feedId)

    return this
  }

  getStreamId(): string {
    if (!this.feedId) return this.channelId

    return `${this.channelId}@${this.feedId}`
  }
}
