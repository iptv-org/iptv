const parser = require('./helpers/parser')
const utils = require('./helpers/utils')
const file = require('./helpers/file')
const log = require('./helpers/log')

async function main() {
  log.start()

  log.print(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex().filter(i => i.url !== 'channels/unsorted.m3u')
  for (const playlist of playlists) {
    log.print(`\nProcessing '${playlist.url}'...`)
    await parser
      .parsePlaylist(playlist.url)
      .then(formatPlaylist)
      .then(playlist => {
        if (file.read(playlist.url) !== playlist.toString()) {
          log.print('updated')
          playlist.updated = true
        }

        playlist.save()
      })
  }

  log.print('\n')
  log.finish()
}

async function formatPlaylist(playlist) {
  for (const channel of playlist.channels) {
    const code = file.getBasename(playlist.url)
    // add missing tvg-name
    if (!channel.tvg.name && code !== 'unsorted' && channel.name) {
      channel.tvg.name = channel.name.replace(/\"/gi, '')
    }
    // add missing tvg-id
    if (!channel.tvg.id && code !== 'unsorted' && channel.tvg.name) {
      const id = utils.name2id(channel.tvg.name)
      channel.tvg.id = id ? `${id}.${code}` : ''
    }
    // add missing country
    if (!channel.countries.length) {
      const name = utils.code2name(code)
      channel.countries = name ? [{ code, name }] : []
      channel.tvg.country = channel.countries.map(c => c.code.toUpperCase()).join(';')
    }
    // update group-title
    channel.group.title = channel.category
  }

  return playlist
}

main()
