import { Table } from 'console-table-printer'

export class CliTable {
  table: Table

  constructor(options?) {
    this.table = new Table(options)
  }

  append(row) {
    this.table.addRow(row)
  }

  render() {
    this.table.printTable()
  }

  toString() {
    return this.table.render()
  }
}
