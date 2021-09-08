const parser = require('./helpers/parser')
const file = require('./helpers/file')
const log = require('./helpers/log')

async function main() {
  log.start()

  let files = await file.list()
  if (!files.length) log.print(`No files is selected\n`)
  files = files.filter(file => file !== 'channels/unsorted.m3u')
  for (const file of files) {
    log.print(`\nProcessing '${file}'...`)
    await parser
      .parsePlaylist(file)
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
