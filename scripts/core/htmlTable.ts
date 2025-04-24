type Column = {
  name: string
  nowrap?: boolean
  align?: string
}

type DataItem = string[]

export class HTMLTable {
  data: DataItem[]
  columns: Column[]

  constructor(data: DataItem[], columns: Column[]) {
    this.data = data
    this.columns = columns
  }

  toString() {
    let output = '<table>\r\n'

    output += '  <thead>\r\n    <tr>'
    for (const column of this.columns) {
      output += `<th align="left">${column.name}</th>`
    }
    output += '</tr>\r\n  </thead>\r\n'

    output += '  <tbody>\r\n'
    for (const item of this.data) {
      output += '    <tr>'
      let i = 0
      for (const prop in item) {
        const column = this.columns[i]
        const nowrap = column.nowrap ? ' nowrap' : ''
        const align = column.align ? ` align="${column.align}"` : ''
        output += `<td${align}${nowrap}>${item[prop]}</td>`
        i++
      }
      output += '</tr>\r\n'
    }
    output += '  </tbody>\r\n'

    output += '</table>'

    return output
  }
}
