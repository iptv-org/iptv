const file = require('./file')

const playlist = {}

playlist.create = async function (filepath) {
  playlist.filepath = filepath
  const dir = file.dirname(filepath)
  file.createDir(dir)
  await file.create(filepath, '')

  return playlist
}

playlist.header = async function (attrs) {
  let header = `#EXTM3U`
  for (const name in attrs) {
    const value = attrs[name]
    header += ` ${name}="${value}"`
  }
  header += `\n`

  await file.append(playlist.filepath, header)

  return playlist
}

playlist.link = async function (url, title, attrs, vlcOpts) {
  let link = `#EXTINF:-1`
  for (const name in attrs) {
    const value = attrs[name]
    if (value !== undefined) {
      link += ` ${name}="${value}"`
    }
  }
  link += `,${title}\n`
  for (const name in vlcOpts) {
    const value = vlcOpts[name]
    if (value !== undefined) {
      link += `#EXTVLCOPT:${name}=${value}\n`
    }
  }
  link += `${url}\n`

  await file.append(playlist.filepath, link)

  return playlist
}

module.exports = playlist
