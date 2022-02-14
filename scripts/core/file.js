const { create: createPlaylist } = require('./playlist')
const store = require('./store')
const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const _ = require('lodash')

const file = {}

file.list = function (pattern) {
  return new Promise(resolve => {
    glob(pattern, function (err, files) {
      resolve(files)
    })
  })
}

file.getFilename = function (filepath) {
  return path.parse(filepath).name
}

file.createDir = async function (dir) {
  if (await file.exists(dir)) return

  return fs.mkdir(dir, { recursive: true }).catch(console.error)
}

file.exists = function (filepath) {
  return fs.exists(path.resolve(filepath))
}

file.read = function (filepath) {
  return fs.readFile(path.resolve(filepath), { encoding: 'utf8' }).catch(console.error)
}

file.append = function (filepath, data) {
  return fs.appendFile(path.resolve(filepath), data).catch(console.error)
}

file.create = function (filepath, data = '') {
  filepath = path.resolve(filepath)
  const dir = path.dirname(filepath)

  return file
    .createDir(dir)
    .then(() => fs.writeFile(filepath, data, { encoding: 'utf8', flag: 'w' }))
    .catch(console.error)
}

file.write = function (filepath, data = '') {
  return fs.writeFile(path.resolve(filepath), data).catch(console.error)
}

file.clear = function (filepath) {
  return file.write(filepath, '')
}

file.resolve = function (filepath) {
  return path.resolve(filepath)
}

file.dirname = function (filepath) {
  return path.dirname(filepath)
}

file.basename = function (filepath) {
  return path.basename(filepath)
}

// file.saveAsM3U = async function (filepath, items, options = {}) {
//   const playlist = createPlaylist(filepath)

//   const header = {}
//   if (options.public) {
//     let guides = items.map(item => item.guides)
//     guides = _.uniq(_.flatten(guides)).sort().join(',')

//     header['x-tvg-url'] = guides
//   }
//   playlist.setHeader(header)

//   for (const item of items) {
//     const stream = store.create(item)

//     let attrs
//     if (options.public) {
//       attrs = {
//         'tvg-id': stream.get('tvg_id'),
//         'tvg-country': stream.get('tvg_country'),
//         'tvg-language': stream.get('tvg_language'),
//         'tvg-logo': stream.get('tvg_logo'),
//         'user-agent': stream.get('http.user-agent') || undefined,
//         'group-title': stream.get('group_title')
//       }
//     } else {
//       attrs = {
//         'tvg-id': stream.get('tvg_id'),
//         'user-agent': stream.get('http.user-agent') || undefined
//       }
//     }

//     playlist.add(stream.get('url'), stream.get('display_name'), attrs, {
//       'http-referrer': stream.get('http.referrer') || undefined,
//       'http-user-agent': stream.get('http.user-agent') || undefined
//     })
//   }

//   return file.write(filepath, playlist.toString())
// }

module.exports = file
