import signale from 'signale'

const { Signale } = signale

export class Logger extends Signale {
  constructor(options?: any) {
    super(options)
  }
}
