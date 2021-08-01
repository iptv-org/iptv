const parser = require('./parser')
const utils = require('./utils')

let globalBuffer = []

async function main() {
  utils.log('Starting...\n')
  console.time('\nDone in')

  const playlists = parseIndex()
  for (const playlist of playlists) {
    await loadPlaylist(playlist.url).then(addToBuffer).then(removeDuplicates).then(savePlaylist)
  }

  if (playlists.length) {
    await loadPlaylist('channels/unsorted.m3u').then(removeUnsortedDuplicates).then(savePlaylist)
  }

  finish()
}

function parseIndex() {
  utils.log(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = playlists.filter(i => i.url !== 'channels/unsorted.m3u')

  return playlists
}

async function loadPlaylist(url) {
  utils.log(`\nProcessing '${url}'...`)
  return parser.parsePlaylist(url)
}

async function addToBuffer(playlist) {
  if (playlist.url === 'channels/unsorted.m3u') return playlist
  globalBuffer = globalBuffer.concat(playlist.channels)

  return playlist
}

async function removeDuplicates(playlist) {
  let buffer = {}
  playlist.channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) {
      buffer[url] = true
    }

    return result
  })

  return playlist
}

async function removeUnsortedDuplicates(playlist) {
  // locally
  let buffer = {}
  let channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) buffer[url] = true

    return result
  })
  // globally
  const urls = globalBuffer.map(i => utils.removeProtocol(i.url))
  channels = channels.filter(i => !urls.includes(utils.removeProtocol(i.url)))
  if (channels.length === playlist.channels.length) return playlist

  playlist.channels = channels

  return playlist
}

async function savePlaylist(playlist) {
  const original = utils.readFile(playlist.url)
  const output = playlist.toString({ raw: true })

  if (original === output) {
    return false
  } else {
    utils.createFile(playlist.url, output)
    utils.log(`updated`)
  }

  return true
}

function finish() {
  console.timeEnd('\nDone in')
}

main()
