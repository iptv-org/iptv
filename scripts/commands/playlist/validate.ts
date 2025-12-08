import { Logger, Collection, Dictionary } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import { data, loadData } from '../../api'
import { ROOT_DIR } from '../../constants'
import { Stream } from '../../models'
import * as sdk from '@iptv-org/sdk'
import { program } from 'commander'
import chalk from 'chalk'

program.argument('[filepath...]', 'Path to file to validate').parse(process.argv)

type LogItem = {
  type: string
  line: number
  message: string
}

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const rootStorage = new Storage(ROOT_DIR)
  const parser = new PlaylistParser({
    storage: rootStorage
  })
  const files = program.args.length ? program.args : await rootStorage.list('streams/**/*.m3u')
  const streams = await parser.parse(files)
  logger.info(`found ${streams.count()} streams`)

  const errors = new Collection()
  const warnings = new Collection()
  const streamsGroupedByFilepath = streams.groupBy((stream: Stream) => stream.getFilepath())
  for (const filepath of streamsGroupedByFilepath.keys()) {
    const streams = streamsGroupedByFilepath.get(filepath)
    if (!streams) continue

    const log = new Collection<LogItem>()
    const buffer = new Dictionary<boolean>()
    streams.forEach((stream: Stream) => {
      if (stream.channel) {
        const channel = data.channelsKeyById.get(stream.channel)
        if (!channel) {
          log.add({
            type: 'warning',
            line: stream.getLine(),
            message: `"${stream.tvgId}" is not in the database`
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

      if (stream.channel) {
        const blocklistRecords = new Collection(
          data.blocklistRecordsGroupedByChannel.get(stream.channel)
        )

        blocklistRecords.forEach((blocklistRecord: sdk.Models.BlocklistRecord) => {
          if (blocklistRecord.reason === 'dmca') {
            log.add({
              type: 'error',
              line: stream.getLine(),
              message: `"${blocklistRecord.channel}" is on the blocklist due to claims of copyright holders (${blocklistRecord.ref})`
            })
          } else if (blocklistRecord.reason === 'nsfw') {
            log.add({
              type: 'error',
              line: stream.getLine(),
              message: `"${blocklistRecord.channel}" is on the blocklist due to NSFW content (${blocklistRecord.ref})`
            })
          }
        })
      }
    })

    if (log.isNotEmpty()) {
      console.log(`\n${chalk.underline(filepath)}`)

      log.forEach((logItem: LogItem) => {
        const position = logItem.line.toString().padEnd(6, ' ')
        const type = logItem.type.padEnd(9, ' ')
        const status = logItem.type === 'error' ? chalk.red(type) : chalk.yellow(type)

        console.log(` ${chalk.gray(position)}${status}${logItem.message}`)
      })

      log.forEach((logItem: LogItem) => {
        if (logItem.type === 'error') errors.add(logItem)
        else if (logItem.type === 'warning') warnings.add(logItem)
      })
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
