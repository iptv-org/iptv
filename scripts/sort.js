const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const log = require('./helpers/log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser
      .parsePlaylist(playlist.url)
      .then(sortChannels)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function sortChannels(playlist) {
  const channels = [...playlist.channels]
  utils.sortBy(channels, ['name', 'status', 'url'])

  if (JSON.stringify(channels) !== JSON.stringify(playlist.channels)) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
