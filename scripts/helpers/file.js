const markdownInclude = require('markdown-include')
const path = require('path')
const glob = require('glob')
const fs = require('fs')

const rootPath = path.resolve(__dirname) + '/../../'
const file = {}

file.list = function (include = [], exclude = []) {
  return new Promise(resolve => {
    glob('channels/*.m3u', function (err, files) {
      console.log(include, exclude)
      if (include.length) {
        include = include.map(filename => `channels/${filename}.m3u`)
        files = files.filter(filename => include.includes(filename))
      }

      if (exclude.length) {
        exclude = exclude.map(filename => `channels/${filename}.m3u`)
        files = files.filter(filename => !exclude.includes(filename))
      }

      resolve(files)
    })
  })
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

file.compileMarkdown = function (filename) {
  markdownInclude.compileFiles(rootPath + filename)
}

module.exports = file
