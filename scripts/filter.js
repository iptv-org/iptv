const blacklist = require('./helpers/blacklist.json')
const parser = require('./helpers/parser')
const log = require('./helpers/log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  const playlists = parser.parseIndex()
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser
      .parsePlaylist(playlist.url)
      .then(removeBlacklisted)
      .then(p => p.save())
  }

  log.print('\n')
  log.finish()
}

async function removeBlacklisted(playlist) {
  const channels = playlist.channels.filter(channel => {
    return !blacklist.find(item => {
      const hasSameName =
        item.name.toLowerCase() === channel.name.toLowerCase() ||
        item.aliases.map(alias => alias.toLowerCase()).includes(channel.name.toLowerCase())
      const fromSameCountry = channel.countries.find(c => c.code === item.country)

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
