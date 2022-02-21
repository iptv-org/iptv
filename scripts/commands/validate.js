const blocklist = require('../data/blocklist')
const parser = require('iptv-playlist-parser')
const { file, logger } = require('../core')
const { program } = require('commander')

const options = program
  .option('--input-dir <input-dir>', 'Set path to input directory', 'channels')
  .parse(process.argv)
  .opts()

async function main() {
  const files = await file.list(`${options.inputDir}/**/*.m3u`)
  const errors = []
  for (const filepath of files) {
    const content = await file.read(filepath)
    const playlist = parser.parse(content)
    const basename = file.basename(filepath)
    const [_, country] = basename.match(/([a-z]{2})(|_.*)\.m3u/i) || [null, null]

    const items = playlist.items
      .map(item => {
        const details = check(item, country)

        return details ? { ...item, details } : null
      })
      .filter(i => i)

    items.forEach(item => {
      errors.push(
        `${filepath}:${item.line}   '${item.details.name}' is on the blocklist due to claims of copyright holders (${item.details.reference})`
      )
    })
  }

  errors.forEach(error => {
    logger.error(error)
  })

  if (errors.length) {
    logger.info('')
    process.exit(1)
  }
}

function check(channel, country) {
  return blocklist.find(item => {
    const regexp = new RegExp(item.regex, 'i')
    const hasSameName = regexp.test(channel.name)
    const fromSameCountry = country === item.country.toLowerCase()

    return hasSameName && fromSameCountry
  })
}

main()
