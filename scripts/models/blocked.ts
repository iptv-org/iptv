type BlockedProps = {
  channel: string
  reason: string
  ref: string
}

export class Blocked {
  channelId: string
  reason: string
  ref: string

  constructor(data: BlockedProps) {
    this.channelId = data.channel
    this.reason = data.reason
    this.ref = data.ref
  }
}
