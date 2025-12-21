import { Collection } from '@freearhey/core'

export type HTMLTableColumn = {
  name: string
  nowrap?: boolean
  align?: string
}

export type HTMLTableItem = string[]

export class HTMLTable {
  data: Collection<HTMLTableItem>
  columns: Collection<HTMLTableColumn>

  constructor(data: Collection<HTMLTableItem>, columns: Collection<HTMLTableColumn>) {
    this.data = data
    this.columns = columns
  }

  toString() {
    const columns = this.columns.all()
    const headers = columns.map(col => `<th align="left">${col.name}</th>`).join('')
    const rows = this.data.map(item => {
      let cells = ''
      let i = 0
      for (const prop in item) {
        const column = columns[i]
        const nowrap = column.nowrap ? ' nowrap' : ''
        const align = column.align ? ` align="${column.align}"` : ''
        const value = this.escape(item[prop])
        cells += `<td${align}${nowrap}>${value}</td>`
        i++
      }
      return `    <tr>${cells}</tr>`
    }).join('\r\n')

    return [
      '<table>',
      '  <thead>',
      `    <tr>${headers}</tr>`,
      '  </thead>',
      '  <tbody>',
      rows,
      '  </tbody>',
      '</table>'
    ].join('\r\n')
  }

  escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}
