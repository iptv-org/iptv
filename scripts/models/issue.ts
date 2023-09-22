import { Dictionary } from '@freearhey/core'

type IssueProps = {
  number: number
  labels: string[]
  data: Dictionary
}

export class Issue {
  number: number
  labels: string[]
  data: Dictionary

  constructor({ number, labels, data }: IssueProps) {
    this.number = number
    this.labels = labels
    this.data = data
  }
}
