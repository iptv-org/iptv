import { IssueData } from '../core'

type IssueProps = {
  number: number
  labels: string[]
  data: IssueData
}

export class Issue {
  number: number
  labels: string[]
  data: IssueData

  constructor({ number, labels, data }: IssueProps) {
    this.number = number
    this.labels = labels
    this.data = data
  }
}
