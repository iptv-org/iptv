import { Logger, Storage, Collection } from '@freearhey/core'
import { ROOT_DIR, STREAMS_DIR, DATA_DIR } from '../../constants'
import { PlaylistParser, StreamTester, CliTable, DataProcessor, DataLoader } from '../../core'
import { Stream } from '../../models'
import { program } from 'commander'
import { eachLimit } from 'async-es'
import commandExists from 'command-exists'
import chalk from 'chalk'
import os from 'node:os'
import dns from 'node:dns'
import type { DataLoaderData } from '../../types/dataLoader'
import type { DataProcessorData } from '../../types/dataProcessor'

const cpus = os.cpus()

const LIVE_UPDATE_INTERVAL = 5000
const LIVE_UPDATE_MAX_STREAMS = 100

let errors = 0
let warnings = 0
const results = {}
let interval
let streams = new Collection()
let isLiveUpdateEnabled = true

program
  .argument('[filepath]', 'Path to file to validate')
  .option(
    '-p, --parallel <number>',
    'Batch size of streams to test concurrently',
    cpus.length,
    (value: string) => parseInt(value)
  )
  .option('-x, --proxy <url>', 'Use the specified proxy')
  .parse(process.argv)

const options = program.opts()

const logger = new Logger()
const tester = new StreamTester()

async function main() {
  if (await isOffline()) {
    logger.error(chalk.red('Internet connection is required for the script to work'))

    return
  }

  if (!commandExists.sync('ffprobe')) {
    logger.error(
      chalk.red(
        'For the script to work, the “ffprobe” library must be installed (https://ffmpeg.org/download.html)'
      )
    )

    return
  }

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const { channelsKeyById, feedsGroupedByChannelId, logosGroupedByStreamId }: DataProcessorData =
    processor.process(data)

  logger.info('loading streams...')
  const rootStorage = new Storage(ROOT_DIR)
  const parser = new PlaylistParser({
    storage: rootStorage,
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId
  })
  const files = program.args.length ? program.args : await rootStorage.list(`${STREAMS_DIR}/*.m3u`)
  streams = await parser.parse(files)

  logger.info(`found ${streams.count()} streams`)
  if (streams.count() > LIVE_UPDATE_MAX_STREAMS) isLiveUpdateEnabled = false

  logger.info('starting...')
  if (!isLiveUpdateEnabled) {
    drawTable()
    interval = setInterval(() => {
      drawTable()
    }, LIVE_UPDATE_INTERVAL)
  }

  await eachLimit(
    streams.all(),
    options.parallel,
    async (stream: Stream) => {
      await runTest(stream)

      if (isLiveUpdateEnabled) {
        drawTable()
      }
    },
    onFinish
  )
}

main()

async function runTest(stream: Stream) {
  const key = stream.filepath + stream.getId() + stream.url
  results[key] = chalk.white('LOADING...')

  const result = await tester.test(stream)

  let status = ''
  const errorStatusCodes = ['HTTP_NOT_FOUND']
  if (result.status.ok) status = chalk.green('OK')
  else if (errorStatusCodes.includes(result.status.code)) {
    status = chalk.red(result.status.code)
    errors++
  } else {
    status = chalk.yellow(result.status.code)
    warnings++
  }

  results[key] = status
}

function drawTable() {
  process.stdout.write('\u001b[3J\u001b[1J')
  console.clear()

  const streamsGrouped = streams.groupBy((stream: Stream) => stream.filepath)
  for (const filepath of streamsGrouped.keys()) {
    const streams: Stream[] = streamsGrouped.get(filepath)

    const table = new CliTable({
      columns: [
        { name: '', alignment: 'center', minLen: 3, maxLen: 3 },
        { name: 'tvg-id', alignment: 'left', color: 'green', minLen: 25, maxLen: 25 },
        { name: 'url', alignment: 'left', color: 'green', minLen: 100, maxLen: 100 },
        { name: 'status', alignment: 'left', minLen: 25, maxLen: 25 }
      ]
    })
    streams.forEach((stream: Stream, index: number) => {
      const status = results[stream.filepath + stream.getId() + stream.url] || chalk.gray('PENDING')

      const row = {
        '': index,
        'tvg-id': stream.getId().length > 25 ? stream.getId().slice(0, 22) + '...' : stream.getId(),
        url: stream.url.length > 100 ? stream.url.slice(0, 97) + '...' : stream.url,
        status
      }
      table.append(row)
    })

    process.stdout.write(`\n${chalk.underline(filepath)}\n`)

    process.stdout.write(table.toString())
  }
}

function onFinish(error) {
  clearInterval(interval)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  drawTable()

  if (errors > 0 || warnings > 0) {
    console.log(
      chalk.red(`\n${errors + warnings} problems (${errors} errors, ${warnings} warnings)`)
    )

    if (errors > 0) {
      process.exit(1)
    }
  }

  process.exit(0)
}

async function isOffline() {
  return new Promise((resolve, reject) => {
    dns.lookup('info.cern.ch', err => {
      if (err) resolve(true)
      reject(false)
    })
  }).catch(() => {})
}
