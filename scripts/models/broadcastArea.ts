type BroadcastAreaProps = {
  code: string
}

export class BroadcastArea {
  code: string

  constructor(data: BroadcastAreaProps) {
    this.code = data.code
  }
}
