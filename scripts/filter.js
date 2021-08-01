const blacklist = require('./blacklist.json')
const parser = require('./parser')
const utils = require('./utils')
const log = require('./log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  const playlists = parser.parseIndex()
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser.parsePlaylist(playlist.url).then(removeBlacklisted).then(utils.savePlaylist)
  }

  log.finish()
}

async function removeBlacklisted(playlist) {
  const channels = playlist.channels.filter(channel => {
    return !blacklist.find(i => {
      const channelName = channel.name.toLowerCase()
      return (
        (i.name.toLowerCase() === channelName ||
          i.aliases.map(i => i.toLowerCase()).includes(channelName)) &&
        i.country === channel.filename
      )
    })
  })

  if (playlist.channels.length !== channels.length) {
    log.print(`updated`)
  }

  playlist.channels = channels

  return playlist
}

main()
