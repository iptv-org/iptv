import { DataSet } from '../core'

type IssueProps = {
  number: number
  labels: string[]
  dataSet: DataSet
}

export class Issue {
  number: number
  labels: string[]
  dataSet: DataSet

  constructor({ number, labels, dataSet }: IssueProps) {
    this.number = number
    this.labels = labels
    this.dataSet = dataSet
  }
}
