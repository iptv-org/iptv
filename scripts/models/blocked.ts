type BlockedProps = {
  channel: string
  ref: string
}

export class Blocked {
  channel: string
  ref: string

  constructor({ ref, channel }: BlockedProps) {
    this.channel = channel
    this.ref = ref
  }
}
