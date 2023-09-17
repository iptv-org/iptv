import { Dictionary } from '../core'

type IssueProps = {
  number: number
  data: Dictionary
}

export class Issue {
  number: number
  data: Dictionary

  constructor({ number, data }: IssueProps) {
    this.number = number
    this.data = data
  }
}
