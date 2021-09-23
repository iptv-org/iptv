const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
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
      .then(sortChannels)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function sortChannels(playlist) {
  let channels = [...playlist.channels]
  channels = utils.sortBy(
    channels,
    ['name', 'status', 'resolution.height', 'url'],
    ['asc', 'asc', 'desc', 'asc']
  )

  if (JSON.stringify(channels) !== JSON.stringify(playlist.channels)) {
    log.print('updated')
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
