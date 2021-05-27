const parser = require('./parser')
const utils = require('./utils')

let globalBuffer = []

async function main() {
  const playlists = parseIndex()

  for (const playlist of playlists) {
    await loadPlaylist(playlist.url)
      .then(addToBuffer)
      .then(removeDuplicates)
      .then(savePlaylist)
      .then(done)
  }

  if (playlists.length) {
    await loadPlaylist('channels/unsorted.m3u')
      .then(removeUnsortedDuplicates)
      .then(savePlaylist)
      .then(done)
  }

  finish()
}

function parseIndex() {
  console.info(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = playlists.filter(i => i.url !== 'channels/unsorted.m3u')
  console.info(`Found ${playlists.length} playlist(s)\n`)

  return playlists
}

async function loadPlaylist(url) {
  console.info(`Processing '${url}'...`)
  return parser.parsePlaylist(url)
}

async function addToBuffer(playlist) {
  if (playlist.url === 'channels/unsorted.m3u') return playlist
  globalBuffer = globalBuffer.concat(playlist.channels)

  return playlist
}

async function removeDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
  let buffer = {}
  const channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) {
      buffer[url] = true
    }

    return result
  })

  playlist.channels = channels

  return playlist
}

async function removeUnsortedDuplicates(playlist) {
  console.info(`  Looking for duplicates...`)
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
    console.info(`No changes have been made.`)
    return false
  } else {
    utils.createFile(playlist.url, output)
    console.info(`Playlist has been updated.`)
  }

  return true
}

async function done() {
  console.info(` `)
}

function finish() {
  console.info('Done.')
}

main()
