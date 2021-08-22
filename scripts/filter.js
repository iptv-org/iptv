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

function removeBlacklisted(playlist) {
  const channels = playlist.channels.filter(channel => {
    const channelName = normalizeName(channel.name)
    return !blacklist.find(item => {
      const hasSameName =
        normalizeName(item.name) === channelName ||
        item.aliases.map(alias => normalizeName(alias)).includes(channelName)
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

function normalizeName(str) {
  return str.replace(/[^a-zA-Z0-9 ]/gi, '').toLowerCase()
}

main()
