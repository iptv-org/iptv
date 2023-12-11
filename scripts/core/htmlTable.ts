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
    let output = '<table>\n'

    output += '  <thead>\n    <tr>'
    for (const column of this.columns) {
      output += `<th align="left">${column.name}</th>`
    }
    output += '</tr>\n  </thead>\n'

    output += '  <tbody>\n'
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
      output += '</tr>\n'
    }
    output += '  </tbody>\n'

    output += '</table>'

    return output
  }
}
