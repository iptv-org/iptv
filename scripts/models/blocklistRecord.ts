import type { BlocklistRecordData } from '../types/blocklistRecord'

export class BlocklistRecord {
  channelId: string
  reason: string
  ref: string

  constructor(data?: BlocklistRecordData) {
    if (!data) return

    this.channelId = data.channel
    this.reason = data.reason
    this.ref = data.ref
  }
}
