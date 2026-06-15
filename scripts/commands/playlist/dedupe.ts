import { Collection, Logger } from '@freearhey/core'
import { OptionValues, program } from 'commander'
import { Storage } from '@freearhey/storage-js'
import { Stream, Playlist } from '../../models'
import { STREAMS_DIR } from '../../constants'
import { PlaylistParser } from '../../core'

program
  .option(
    '-o, --output <filename>',
    'Filename (relative to the streams dir) to write the deduplicated playlist to',
    'best.m3u'
  )
  .option('-d, --dry-run', 'Print stats without writing the output file', false)
  .parse(process.argv)

const options: OptionValues = program.opts()

type ScoredStream = {
  stream: Stream
  score: number
  order: number
}

function scoreStream(stream: Stream, order: number): ScoredStream {
  // Higher score wins. Tie-breakers favor earlier occurrence (stable).
  // 1. Vertical resolution (1080p > 720p > ...). Capped contribution: up to ~4320.
  // 2. HTTPS is preferred over HTTP (+50).
  // 3. Presence of a tvg-id (+10), since untagged streams are less useful downstream.
  let score = stream.getVerticalResolution()

  if (stream.url && stream.url.toLowerCase().startsWith('https://')) {
    score += 50
  }

  if (stream.getTvgId()) {
    score += 10
  }

  return { stream, score, order }
}

function dedupeKey(stream: Stream): string {
  const tvgId = stream.getTvgId()
  if (tvgId) return `id:${tvgId}`

  // Fall back to a normalized title when no tvg-id is present.
  // This keeps unidentified streams from collapsing into a single bucket.
  return `title:${(stream.title || '').trim().toLowerCase()}|${stream.url}`
}

async function main() {
  const logger = new Logger()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  // Avoid re-reading a previously generated output file.
  const inputFiles = files.filter((filepath: string) => filepath !== options.output)
  const streams = await parser.parse(inputFiles)
  logger.info(`found ${streams.count()} streams across ${inputFiles.length} files`)

  logger.info('grouping by channel...')
  const groups = new Map<string, ScoredStream[]>()
  streams.forEach((stream: Stream, index: number) => {
    const key = dedupeKey(stream)
    const scored = scoreStream(stream, index)
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(scored)
    } else {
      groups.set(key, [scored])
    }
  })

  logger.info(`grouped into ${groups.size} unique channels`)

  const best = new Collection<Stream>()
  let collisions = 0
  for (const bucket of groups.values()) {
    if (bucket.length > 1) collisions += bucket.length - 1

    bucket.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.order - b.order
    })

    best.add(bucket[0].stream)
  }

  logger.info(`removed ${collisions} duplicate stream(s)`)

  best.sortBy(
    [(stream: Stream) => (stream.title || '').toLowerCase(), (stream: Stream) => stream.url],
    ['asc', 'asc']
  )

  if (options.dryRun) {
    logger.info(`[dry-run] would write ${best.count()} streams to ${options.output}`)
    return
  }

  logger.info(`saving ${best.count()} streams to ${options.output}...`)
  const playlist = new Playlist(best, { public: false })
  await streamsStorage.save(options.output, playlist.toString())
}

main()
