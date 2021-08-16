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
      .then(addToGlobalBuffer)
      .then(removeDuplicates)
      .then(p => p.save())
  }

  if (playlists.length) {
    log.print(`\nProcessing 'channels/unsorted.m3u'...`)
    await parser
      .parsePlaylist('channels/unsorted.m3u')
      .then(removeDuplicates)
      .then(removeGlobalDuplicates)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function addToGlobalBuffer(playlist) {
  playlist.channels.forEach(channel => {
    const url = utils.removeProtocol(channel.url)
    globalBuffer.push(url)
  })

  return playlist
}

async function removeDuplicates(playlist) {
  const buffer = []
  const channels = playlist.channels.filter(channel => {
    const sameUrl = buffer.find(item => {
      return utils.removeProtocol(item.url) === utils.removeProtocol(channel.url)
    })
    if (sameUrl) return false

    buffer.push(channel)
    return true
  })

  if (playlist.channels.length !== channels.length) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

async function removeGlobalDuplicates(playlist) {
  const channels = playlist.channels.filter(channel => {
    const url = utils.removeProtocol(channel.url)
    return !globalBuffer.includes(url)
  })

  if (channels.length !== playlist.channels.length) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
