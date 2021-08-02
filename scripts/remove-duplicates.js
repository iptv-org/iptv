const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const log = require('./helpers/log')

let globalBuffer = []

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  const playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser
      .parsePlaylist(playlist.url)
      .then(addToBuffer)
      .then(removeDuplicates)
      .then(p => p.save())
  }

  if (playlists.length) {
    log.print(`\nProcessing 'channels/unsorted.m3u'...`)
    await parser
      .parsePlaylist('channels/unsorted.m3u')
      .then(removeUnsortedDuplicates)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function addToBuffer(playlist) {
  globalBuffer = globalBuffer.concat(playlist.channels)

  return playlist
}

async function removeDuplicates(playlist) {
  let buffer = {}
  const channels = playlist.channels.filter(i => {
    const url = utils.removeProtocol(i.url)
    const result = typeof buffer[url] === 'undefined'
    if (result) {
      buffer[url] = true
    }

    return result
  })

  if (playlist.channels.length !== channels.length) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

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

  if (channels.length !== playlist.channels.length) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
