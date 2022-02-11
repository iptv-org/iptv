const { file, logger, api, parser, blocklist } = require('../core')
const { program } = require('commander')
const chalk = require('chalk')

program.argument('<filepath>', 'Path to file to validate').parse(process.argv)

async function main() {
  await api.channels.load()

  let errors = []
  let warnings = []
  for (const filepath of program.args) {
    if (!filepath.endsWith('.m3u')) continue

    const basename = file.basename(filepath)
    const [_, countryCode] = basename.match(/([a-z]{2})(|_.*)\.m3u/i) || [null, null]

    const fileLog = []
    const streams = await parser.parsePlaylist(filepath)
    for (const stream of streams) {
      const found = blocklist.find(stream.name, countryCode.toUpperCase())
      if (found) {
        fileLog.push({
          type: 'error',
          line: stream.line,
          message: `"${found.name}" is on the blocklist due to claims of copyright holders (${found.reference})`
        })
      }

      if (stream.tvg.id && !api.channels.find({ id: stream.tvg.id })) {
        fileLog.push({
          type: 'warning',
          line: stream.line,
          message: `"${stream.tvg.id}" is not in the database`
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
