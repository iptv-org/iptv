import { PlaylistParser, StreamTester, CliTable } from '../../core'
import type { StreamTesterResult } from '../../core/streamTester'
import { ROOT_DIR, STREAMS_DIR } from '../../constants'
import { Logger, Collection } from '@freearhey/core'
import { program, OptionValues } from 'commander'
import { Storage } from '@freearhey/storage-js'
import { Playlist, Stream } from '../../models'
import { truncate } from '../../utils'
import { loadData } from '../../api'
import { eachLimit } from 'async'
import dns from 'node:dns'
import chalk from 'chalk'
import os from 'node:os'

const LIVE_UPDATE_INTERVAL = 5000
const LIVE_UPDATE_MAX_STREAMS = 100

let errors = 0
let warnings = 0
let interval: string | number | NodeJS.Timeout | undefined
let streams = new Collection<Stream>()
let isLiveUpdateEnabled = true
const errorStatusCodes = [
  'ECONNREFUSED',
  'ENOTFOUND',
  'ENETUNREACH',
  'EPROTO',
  'HTTP_401_UNAUTHORIZED',
  'HTTP_404_',
  'HTTP_404_NOT_FOUND',
  'HTTP_404_UNKNOWN_ERROR',
  'HTTP_410_GONE'
]

program
  .argument('[filepath...]', 'Path to file to test')
  .option(
    '-p, --parallel <number>',
    'Batch size of streams to test concurrently',
    (value: string) => parseInt(value),
    os.cpus().length
  )
  .option('-x, --proxy <url>', 'Use the specified proxy')
  .option(
    '-t, --timeout <number>',
    'The number of milliseconds before the request will be aborted',
    (value: string) => parseInt(value),
    30000
  )
  .option('--fix', 'Remove all broken links found from files')
  .parse(process.argv)

const options: OptionValues = program.opts()

const logger = new Logger()
const tester = new StreamTester({ options })
const rootStorage = new Storage(ROOT_DIR)

async function main() {
  if (await isOffline()) {
    logger.error(chalk.red('Internet connection is required for the script to work'))
    return
  }

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const parser = new PlaylistParser({
    storage: rootStorage
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

  eachLimit(
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
  stream.statusCode = 'LOADING...'
  const result: StreamTesterResult = await tester.test(stream)
  stream.statusCode = result.status.code

  if (stream.statusCode === 'OK') return
  if (errorStatusCodes.includes(stream.statusCode) && !stream.label) {
    errors++
  } else {
    warnings++
  }
}

function drawTable() {
  process.stdout.write('\u001b[3J\u001b[1J')
  console.clear()

  const streamsGrouped = streams.groupBy((stream: Stream) => stream.filepath)
  for (const filepath of streamsGrouped.keys()) {
    const streams: Stream[] = streamsGrouped.get(filepath) || []

    const table = new CliTable({
      columns: [
        { name: '', alignment: 'center', minLen: 3, maxLen: 3 },
        { name: 'tvg-id', alignment: 'left', color: 'green', minLen: 25, maxLen: 25 },
        { name: 'url', alignment: 'left', color: 'green', minLen: 100, maxLen: 100 },
        { name: 'label', alignment: 'left', color: 'yellow', minLen: 13, maxLen: 13 },
        { name: 'status', alignment: 'left', minLen: 25, maxLen: 25 }
      ]
    })

    streams.forEach((stream: Stream, index: number) => {
      const tvgId = truncate(stream.getTvgId(), 25)
      const url = truncate(stream.url, 100)
      const color = getColor(stream)
      const label = stream.label || ''
      const status = stream.statusCode || 'PENDING'

      const row = {
        '': index,
        'tvg-id': chalk[color](tvgId),
        url: chalk[color](url),
        label: chalk[color](label),
        status: chalk[color](status)
      }
      table.append(row)
    })

    process.stdout.write(`\n${chalk.underline(filepath)}\n`)

    process.stdout.write(table.toString())
  }
}

async function removeBrokenLinks() {
  const streamsGrouped = streams.groupBy((stream: Stream) => stream.filepath)
  for (const filepath of streamsGrouped.keys()) {
    let streams: Collection<Stream> = new Collection(streamsGrouped.get(filepath))

    streams = streams.filter((stream: Stream) => !isBroken(stream))

    const playlist = new Playlist(streams, { public: false })
    await rootStorage.save(filepath, playlist.toString())
  }
}

async function onFinish(error: Error | null | undefined) {
  clearInterval(interval)

  if (error) {
    console.error(error)
    process.exit(1)
  }

  if (options.fix) {
    await removeBrokenLinks()
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

function getColor(stream: Stream): string {
  if (!stream.statusCode) return 'gray'
  if (stream.statusCode === 'LOADING...') return 'white'
  if (stream.statusCode === 'OK') return 'green'
  if (errorStatusCodes.includes(stream.statusCode) && !stream.label) return 'red'

  return 'yellow'
}

function isBroken(stream: Stream): boolean {
  if (!stream.statusCode) return false
  if (stream.label) return false
  if (!errorStatusCodes.includes(stream.statusCode)) return false

  return true
}
