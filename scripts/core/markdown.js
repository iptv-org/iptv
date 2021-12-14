const markdownInclude = require('markdown-include')
const file = require('./file')

const markdown = {}

markdown.createTable = function (data, cols) {
  let output = '<table>\n'

  output += '  <thead>\n    <tr>'
  for (let column of cols) {
    output += `<th align="${column.align}">${column.name}</th>`
  }
  output += '</tr>\n  </thead>\n'

  output += '  <tbody>\n'
  for (let item of data) {
    output += '    <tr>'
    let i = 0
    for (let prop in item) {
      const column = cols[i]
      let nowrap = column.nowrap
      let align = column.align
      output += `<td align="${align}"${nowrap ? ' nowrap' : ''}>${item[prop]}</td>`
      i++
    }
    output += '</tr>\n'
  }
  output += '  </tbody>\n'

  output += '</table>'

  return output
}

markdown.compile = function (filepath) {
  markdownInclude.compileFiles(file.resolve(filepath))
}

module.exports = markdown
