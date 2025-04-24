import type { GuideData, GuideSerializedData } from '../types/guide'

export class Guide {
  channelId?: string
  feedId?: string
  siteDomain: string
  siteId: string
  siteName: string
  languageCode: string

  constructor(data?: GuideData) {
    if (!data) return

    this.channelId = data.channel
    this.feedId = data.feed
    this.siteDomain = data.site
    this.siteId = data.site_id
    this.siteName = data.site_name
    this.languageCode = data.lang
  }

  getUUID(): string {
    return this.getStreamId() + this.siteId
  }

  getStreamId(): string | undefined {
    if (!this.channelId) return undefined
    if (!this.feedId) return this.channelId

    return `${this.channelId}@${this.feedId}`
  }

  serialize(): GuideSerializedData {
    return {
      channelId: this.channelId,
      feedId: this.feedId,
      siteDomain: this.siteDomain,
      siteId: this.siteId,
      siteName: this.siteName,
      languageCode: this.languageCode
    }
  }

  deserialize(data: GuideSerializedData): this {
    this.channelId = data.channelId
    this.feedId = data.feedId
    this.siteDomain = data.siteDomain
    this.siteId = data.siteId
    this.siteName = data.siteName
    this.languageCode = data.languageCode

    return this
  }
}
