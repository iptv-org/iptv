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
    let output = '<table>\r\n'

    output += '  <thead>\r\n    <tr>'
    this.columns.forEach((column: HTMLTableColumn) => {
      output += `<th align="left">${column.name}</th>`
    })

    output += '</tr>\r\n  </thead>\r\n'

    output += '  <tbody>\r\n'
    this.data.forEach((item: HTMLTableItem) => {
      output += '    <tr>'
      let i = 0
      for (const prop in item) {
        const column = this.columns.all()[i]
        const nowrap = column.nowrap ? ' nowrap' : ''
        const align = column.align ? ` align="${column.align}"` : ''
        output += `<td${align}${nowrap}>${item[prop]}</td>`
        i++
      }
      output += '</tr>\r\n'
    })

    output += '  </tbody>\r\n'

    output += '</table>'

    return output
  }
}
