const fs = require('fs')
const path = require('path')

const rootPath = path.resolve(__dirname) + '/../../'
const file = {}

file.getBasename = function (filename) {
  return path.basename(filename, path.extname(filename))
}

file.getFilename = function (filename) {
  return path.parse(filename).name
}

file.createDir = function (dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

file.read = function (filename) {
  return fs.readFileSync(rootPath + filename, { encoding: 'utf8' })
}

file.append = function (filename, data) {
  fs.appendFileSync(rootPath + filename, data)
}

file.create = function (filename, data = '') {
  fs.writeFileSync(rootPath + filename, data)
}

file.compileMarkdown = function (filepath) {
  return markdownInclude.compileFiles(path.resolve(__dirname, filepath))
}

module.exports = file
