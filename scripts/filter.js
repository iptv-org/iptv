const blacklist = require('./data/blacklist.json')
const parser = require('./helpers/parser')
const file = require('./helpers/file')
const log = require('./helpers/log')

async function main() {
  log.start()

  const files = await file.list()
  if (!files.length) log.print(`No files is selected\n`)
  for (const file of files) {
    log.print(`\nProcessing '${file}'...`)
    await parser
      .parsePlaylist(file)
      .then(removeBlacklisted)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

function removeBlacklisted(playlist) {
  const channels = playlist.channels.filter(channel => {
    return !blacklist.find(item => {
      const regexp = new RegExp(item.regex, 'i')
      const hasSameName = regexp.test(channel.name)
      const fromSameCountry = playlist.country.code === item.country

      return hasSameName && fromSameCountry
    })
  })

  if (playlist.channels.length !== channels.length) {
    log.print(`updated`)
    playlist.channels = channels
    playlist.updated = true
  }

  return playlist
}

main()
