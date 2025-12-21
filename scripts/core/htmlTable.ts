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
      const cells = columns.map((col, i) => {
        const nowrap = col.nowrap ? ' nowrap' : ''
        const align = col.align ? ` align="${col.align}"` : ''
        return `<td${align}${nowrap}>${item[i]}</td>`
      }).join('')
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
}
