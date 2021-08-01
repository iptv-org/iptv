const { program } = require('commander')
const parser = require('./parser')
const utils = require('./utils')

program
  .usage('[OPTIONS]...')
  .option('-d, --debug', 'Debug mode')
  .option('-c, --country <country>', 'Comma-separated list of country codes', '')
  .option('-e, --exclude <exclude>', 'Comma-separated list of country codes to be excluded', '')
  .parse(process.argv)

const config = program.opts()

async function main() {
  utils.log('Starting...\n')
  console.time('\nDone in')

  const playlists = parseIndex()

  for (const playlist of playlists) {
    await loadPlaylist(playlist.url).then(sortChannels).then(savePlaylist)
  }

  finish()
}

function parseIndex() {
  utils.log(`Parsing 'index.m3u'...`)
  let playlists = parser.parseIndex()
  playlists = utils
    .filterPlaylists(playlists, config.country, config.exclude)
    .filter(i => i.url !== 'channels/unsorted.m3u')

  return playlists
}

async function loadPlaylist(url) {
  utils.log(`\nProcessing '${url}'...`)
  return parser.parsePlaylist(url)
}

async function sortChannels(playlist) {
  playlist.channels = utils.sortBy(playlist.channels, ['name', 'url'])

  return playlist
}

async function savePlaylist(playlist) {
  const original = utils.readFile(playlist.url)
  const output = playlist.toString()

  if (original === output) {
    return false
  } else {
    utils.createFile(playlist.url, output)
    utils.log(`updated`)
  }

  return true
}

function finish() {
  console.timeEnd('\nDone in')
}

main()
