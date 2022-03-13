const { file, logger, api, parser, id } = require('../../core')
const { program } = require('commander')
const chalk = require('chalk')
const _ = require('lodash')

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

async function main() {
  const files = program.args.length ? program.args : await file.list('streams/*.m3u')

  logger.info(`loading blocklist...`)
  await api.channels.load()
  await api.blocklist.load()

  let blocklist = await api.blocklist.all()
  blocklist = blocklist
    .map(blocked => {
      const channel = api.channels.find({ id: blocked.channel })
      if (!channel) return null
      return { ...blocked, name: channel.name }
    })
    .filter(i => i)
  logger.info(`found ${blocklist.length} records`)

  let errors = []
  let warnings = []
  for (const filepath of files) {
    if (!filepath.endsWith('.m3u')) continue

    const basename = file.basename(filepath)
    const [__, country] = basename.match(/([a-z]{2})(|_.*)\.m3u/i) || [null, null]

    const fileLog = []
    const playlist = await parser.parsePlaylist(filepath)
    for (const item of playlist.items) {
      if (item.tvg.id && !api.channels.find({ id: item.tvg.id })) {
        fileLog.push({
          type: 'warning',
          line: item.line,
          message: `"${item.tvg.id}" is not in the database`
        })
      }

      const channel_id = id.generate(item.name, country)
      const found = blocklist.find(
        blocked =>
          item.tvg.id.toLowerCase() === blocked.channel.toLowerCase() ||
          channel_id.toLowerCase() === blocked.channel.toLowerCase()
      )
      if (found) {
        fileLog.push({
          type: 'error',
          line: item.line,
          message: `"${found.name}" is on the blocklist due to claims of copyright holders (${found.ref})`
        })
      }
    }

    if (fileLog.length) {
      logger.info(`\n${chalk.underline(filepath)}`)

      fileLog.forEach(err => {
        const position = err.line.toString().padEnd(6, ' ')
        const type = err.type.padEnd(9, ' ')
        const status = err.type === 'error' ? chalk.red(type) : chalk.yellow(type)
        logger.info(` ${chalk.gray(position)}${status}${err.message}`)
      })

      errors = errors.concat(fileLog.filter(e => e.type === 'error'))
      warnings = warnings.concat(fileLog.filter(e => e.type === 'warning'))
    }
  }

  logger.error(
    chalk.red(
      `\n${errors.length + warnings.length} problems (${errors.length} errors, ${
        warnings.length
      } warnings)`
    )
  )

  if (errors.length) {
    process.exit(1)
  }
}

main()
