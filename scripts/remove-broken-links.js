const parser = require('./helpers/parser')
const log = require('./helpers/log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  const playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser
      .parsePlaylist(playlist.url)
      .then(removeBrokenLinks)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function removeBrokenLinks(playlist) {
  const buffer = []
  const channels = playlist.channels.filter(channel => {
    const sameHash = buffer.find(item => item.hash === channel.hash)
    if (sameHash && channel.status === 'Offline') return false

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

main()
