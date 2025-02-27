import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { PlaylistParser } from '../../core'
import { Channel, Stream, Blocked } from '../../models'
import { program } from 'commander'
import chalk from 'chalk'
import _ from 'lodash'
import { DATA_DIR, STREAMS_DIR } from '../../constants'

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

type LogItem = {
  type: string
  line: number
  message: string
}

async function main() {
  const logger = new Logger()

  logger.info(`loading blocklist...`)
  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  const channels = new Collection(channelsContent).map(data => new Channel(data))
  const blocklistContent = await dataStorage.json('blocklist.json')
  const blocklist = new Collection(blocklistContent).map(data => new Blocked(data))

  logger.info(`found ${blocklist.count()} records`)

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = program.args.length ? program.args : await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)

  logger.info(`found ${streams.count()} streams`)

  let errors = new Collection()
  let warnings = new Collection()
  let groupedStreams = streams.groupBy((stream: Stream) => stream.filepath)
  for (const filepath of groupedStreams.keys()) {
    const streams = groupedStreams.get(filepath)
    if (!streams) continue

    const log = new Collection()
    const buffer = new Dictionary()
    streams.forEach((stream: Stream) => {
      const invalidId =
        stream.channel && !channels.first((channel: Channel) => channel.id === stream.channel)
      if (invalidId) {
        log.add({
          type: 'warning',
          line: stream.line,
          message: `"${stream.channel}" is not in the database`
        })
      }

      const duplicate = stream.url && buffer.has(stream.url)
      if (duplicate) {
        log.add({
          type: 'warning',
          line: stream.line,
          message: `"${stream.url}" is already on the playlist`
        })
      } else {
        buffer.set(stream.url, true)
      }

      const blocked = blocklist.first(blocked => stream.channel === blocked.channel)
      if (blocked) {
        if (blocked.reason === 'dmca') {
          log.add({
            type: 'error',
            line: stream.line,
            message: `"${stream.channel}" is on the blocklist due to claims of copyright holders (${blocked.ref})`
          })
        } else if (blocked.reason === 'nsfw') {
          log.add({
            type: 'error',
            line: stream.line,
            message: `"${stream.channel}" is on the blocklist due to NSFW content (${blocked.ref})`
          })
        }
      }
    })

    if (log.notEmpty()) {
      logger.info(`\n${chalk.underline(filepath)}`)

      log.forEach((logItem: LogItem) => {
        const position = logItem.line.toString().padEnd(6, ' ')
        const type = logItem.type.padEnd(9, ' ')
        const status = logItem.type === 'error' ? chalk.red(type) : chalk.yellow(type)

        logger.info(` ${chalk.gray(position)}${status}${logItem.message}`)
      })

      errors = errors.concat(log.filter((logItem: LogItem) => logItem.type === 'error'))
      warnings = warnings.concat(log.filter((logItem: LogItem) => logItem.type === 'warning'))
    }
  }

  logger.error(
    chalk.red(
      `\n${
        errors.count() + warnings.count()
      } problems (${errors.count()} errors, ${warnings.count()} warnings)`
    )
  )

  if (errors.count()) {
    process.exit(1)
  }
}

main()
