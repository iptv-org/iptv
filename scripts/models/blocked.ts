type BlockedProps = {
  channel: string
  reason: string
  ref: string
}

export class Blocked {
  channel: string
  reason: string
  ref: string

  constructor({ ref, reason, channel }: BlockedProps) {
    this.channel = channel
    this.reason = reason
    this.ref = ref
  }
}
