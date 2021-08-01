const parser = require('./parser')
const utils = require('./utils')
const log = require('./log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser.parsePlaylist(playlist.url).then(sortChannels).then(utils.savePlaylist)
  }

  log.finish()
}

async function sortChannels(playlist) {
  const channels = [...playlist.channels]
  utils.sortBy(channels, ['name', 'url'])

  if (JSON.stringify(playlist.channels) !== JSON.stringify(channels)) log.print('updated')

  playlist.channels = channels

  return playlist
}

main()
