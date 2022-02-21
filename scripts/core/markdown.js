const markdownInclude = require('markdown-include')
const file = require('./file')

const markdown = {}

markdown.compile = function (filepath) {
  markdownInclude.compileFiles(file.resolve(filepath))
}

module.exports = markdown
