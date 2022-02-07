const table = {}

table.create = function (data, cols) {
  let output = '<table>\n'

  output += '  <thead>\n    <tr>'
  for (let column of cols) {
    output += `<th align="left">${column.name}</th>`
  }
  output += '</tr>\n  </thead>\n'

  output += '  <tbody>\n'
  for (let item of data) {
    output += '    <tr>'
    let i = 0
    for (let prop in item) {
      const column = cols[i]
      let nowrap = column.nowrap ? ` nowrap` : ''
      let align = column.align ? ` align="${column.align}"` : ''
      output += `<td${align}${nowrap}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '  </tbody>\n'

  output += '</table>'

  return output
}

module.exports = table
