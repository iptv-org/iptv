import { Logger, Storage, Collection, Dictionary, File } from '@freearhey/core'
import { PlaylistParser } from '../../core'
import { Channel, Stream, Blocked } from '../../models'
import { program } from 'commander'
import chalk from 'chalk'
import { transliterate } from 'transliteration'
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

    const file = new File(filepath)
    const [, countryCode] = file.basename().match(/([a-z]{2})(|_.*)\.m3u/i) || [null, '']

    const log = new Collection()
    const buffer = new Dictionary()
    streams.forEach((stream: Stream) => {
      const channelNotInDatabase =
        stream.channel && !channels.first((channel: Channel) => channel.id === stream.channel)
      if (channelNotInDatabase) {
        log.add({
          type: 'warning',
          line: stream.line,
          message: `"${stream.channel}" is not in the database`
        })
      }

      const alreadyOnPlaylist = stream.url && buffer.has(stream.url)
      if (alreadyOnPlaylist) {
        log.add({
          type: 'warning',
          line: stream.line,
          message: `"${stream.url}" is already on the playlist`
        })
      } else {
        buffer.set(stream.url, true)
      }

      const channelId = generateChannelId(stream.name, countryCode)
      const blocked = blocklist.first(
        blocked =>
          stream.channel.toLowerCase() === blocked.channel.toLowerCase() ||
          channelId.toLowerCase() === blocked.channel.toLowerCase()
      )
      if (blocked) {
        log.add({
          type: 'error',
          line: stream.line,
          message: `"${stream.name}" is on the blocklist due to claims of copyright holders or NSFW content (${blocked.ref})`
        })
      }

      const channel_NSFW = stream.channel && channels.first((channel: Channel) => (channel.id === stream.channel) && (channel.isNSFW === true))
      if(channel_NSFW) {
        log.add({
          type: 'error',
          line: stream.line,
          message: `Since January 30th, 2024, NSFW channels are no longer allowed in our playlists. Please see https://github.com/iptv-org/iptv/issues/15723 for further information.`
        })
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

function generateChannelId(name: string, code: string) {
  if (!name || !code) return ''

  name = name.replace(/ *\([^)]*\) */g, '')
  name = name.replace(/ *\[[^)]*\] */g, '')
  name = name.replace(/\+/gi, 'Plus')
  name = name.replace(/[^a-z\d]+/gi, '')
  name = name.trim()
  name = transliterate(name)
  code = code.toLowerCase()

  return `${name}.${code}`
}
