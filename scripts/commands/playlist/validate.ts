import { Logger, Storage, Collection, Dictionary } from '@freearhey/core'
import { DataLoader, DataProcessor, PlaylistParser } from '../../core'
import { DataProcessorData } from '../../types/dataProcessor'
import { DATA_DIR, ROOT_DIR } from '../../constants'
import { DataLoaderData } from '../../types/dataLoader'
import { BlocklistRecord, Stream } from '../../models'
import { program } from 'commander'
import chalk from 'chalk'

program.argument('[filepath]', 'Path to file to validate').parse(process.argv)

type LogItem = {
  type: string
  line: number
  message: string
}

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const {
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId,
    blocklistRecordsGroupedByChannelId
  }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const rootStorage = new Storage(ROOT_DIR)
  const parser = new PlaylistParser({
    storage: rootStorage,
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId
  })
  const files = program.args.length ? program.args : await rootStorage.list('streams/**/*.m3u')
  const streams = await parser.parse(files)
  logger.info(`found ${streams.count()} streams`)

  let errors = new Collection()
  let warnings = new Collection()
  const streamsGroupedByFilepath = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of streamsGroupedByFilepath.keys()) {
    const streams = streamsGroupedByFilepath.get(filepath)
    if (!streams) continue

    const log = new Collection()
    const buffer = new Dictionary()
    streams.forEach((stream: Stream) => {
      if (stream.channelId) {
        const channel = channelsKeyById.get(stream.channelId)
        if (!channel) {
          log.add({
            type: 'warning',
            line: stream.getLine(),
            message: `"${stream.id}" is not in the database`
          })
        }
      }

      const duplicate = stream.url && buffer.has(stream.url)
      if (duplicate) {
        log.add({
          type: 'warning',
          line: stream.getLine(),
          message: `"${stream.url}" is already on the playlist`
        })
      } else {
        buffer.set(stream.url, true)
      }

      const blocklistRecords = stream.channel
        ? new Collection(blocklistRecordsGroupedByChannelId.get(stream.channel.id))
        : new Collection()

      blocklistRecords.forEach((blocklistRecord: BlocklistRecord) => {
        if (blocklistRecord.reason === 'dmca') {
          log.add({
            type: 'error',
            line: stream.getLine(),
            message: `"${blocklistRecord.channelId}" is on the blocklist due to claims of copyright holders (${blocklistRecord.ref})`
          })
        } else if (blocklistRecord.reason === 'nsfw') {
          log.add({
            type: 'error',
            line: stream.getLine(),
            message: `"${blocklistRecord.channelId}" is on the blocklist due to NSFW content (${blocklistRecord.ref})`
          })
        }
      })
    })

    if (log.notEmpty()) {
      console.log(`\n${chalk.underline(filepath)}`)

      log.forEach((logItem: LogItem) => {
        const position = logItem.line.toString().padEnd(6, ' ')
        const type = logItem.type.padEnd(9, ' ')
        const status = logItem.type === 'error' ? chalk.red(type) : chalk.yellow(type)

        console.log(` ${chalk.gray(position)}${status}${logItem.message}`)
      })

      errors = errors.concat(log.filter((logItem: LogItem) => logItem.type === 'error'))
      warnings = warnings.concat(log.filter((logItem: LogItem) => logItem.type === 'warning'))
    }
  }

  if (errors.count() || warnings.count()) {
    console.log(
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
}

main()
