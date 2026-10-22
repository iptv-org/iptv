import { LOGS_DIR, OWNER, REPO, STREAMS_DIR } from '../../constants'
import { loadData, data as apiData } from '../../api'
import { Logger } from '@freearhey/core'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import { Discussion, Stream } from '../../models'
import { loadDiscussions, parseIssueBody } from '../../utils'
import { program } from 'commander'

program
  .requiredOption('--number <number>', 'The discussion number')
  .requiredOption('--body <body>', 'The full markdown body text of the discussion')
  .parse(process.argv)

const { number: discussionNumberStr, body } = program.opts()
const targetDiscussionNumber = parseInt(discussionNumberStr, 10)

const logsStorage = new Storage(LOGS_DIR)

const status = {
  OK: 'ok',
  FULFILLED: 'fulfilled',
  INVALID_CHANNEL_ID: 'invalid_channel_id',
  MISSING_FEED_ID: 'missing_feed_id',
  DUPLICATE_REQUEST: 'duplicate_request'
}

async function main() {
  const logger = new Logger()

  logger.info('loading discussions...')
  const discussions = await loadDiscussions()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({ storage: streamsStorage })
  const files = await streamsStorage.list('**/*.m3u')
  const streams = await parser.parse(files)
  const streamsGroupedById = streams.groupBy((stream: Stream) => stream.getId())

  const discussionData = parseIssueBody(body)
  const streamId =
    discussionData.getString('stream_id') ||
    discussionData.getString('channel_id') ||
    ''
  const [channelId, feedId] = streamId.split('@')

  const priorDiscussions = discussions.filter(
    (d: Discussion) => d.number < targetDiscussionNumber && d.category === 'Channel Search'
  )
  const seenStreamIds = new Set<string>()
  let originalDiscussionNumber: number | null = null

  priorDiscussions.forEach((d: Discussion) => {
    const existingId = d.data.getString('stream_id') || d.data.getString('channel_id') || ''
    if (existingId) {
      seenStreamIds.add(existingId)
      if (existingId === streamId && !originalDiscussionNumber) {
        originalDiscussionNumber = d.number
      }
    }
  })

  let finalStatus = status.OK
  if (!channelId || apiData.channelsKeyById.missing(channelId)) {
    finalStatus = status.INVALID_CHANNEL_ID
  } else if (!feedId) {
    finalStatus = status.MISSING_FEED_ID
  } else if (streamId && seenStreamIds.has(streamId)) {
    finalStatus = status.DUPLICATE_REQUEST
  } else if (streamsGroupedById.has(streamId)) {
    finalStatus = status.FULFILLED
  }

  const repo = process.env.GITHUB_REPOSITORY || OWNER + '/' + REPO
  const sha = process.env.GITHUB_SHA || 'master'

  let comment = ''
  let label = 'check:passed'
  let close = 'false'

  if (finalStatus === status.FULFILLED) {
    for (const filePath of files) {
      const content = await streamsStorage.load(filePath)
      const lines = content.split(/\r?\n/)
      const lineIndex = lines.findIndex(line => line.includes(streamId))
      if (lineIndex !== -1) {
        const permalink = `https://github.com/${repo}/blob/${sha}/streams/${filePath}#L${lineIndex + 1}-L${lineIndex + 2}`
        comment = `A link to the "${streamId}" stream is already in the playlist: ${permalink}`
        label = 'check:failed'
        close = 'true'
        break
      }
    }
  } else if (finalStatus === status.DUPLICATE_REQUEST) {
    comment = `Duplicate of #${originalDiscussionNumber}.`
    label = 'check:failed'
    close = 'true'
  } else if (finalStatus === status.INVALID_CHANNEL_ID) {
    comment = `There is no channel with the ID "${channelId}" in the database.`
    label = 'check:failed'
    close = 'true'
  } else if (finalStatus === status.MISSING_FEED_ID) {
    comment = 'The request is missing the feed ID.'
    label = 'check:failed'
    close = 'true'
  }

  const result = {
    number: targetDiscussionNumber,
    streamId: streamId,
    status: finalStatus,
    label: label,
    comment: comment,
    close: close
  }

  logsStorage.saveSync('result.json', JSON.stringify(result, null, 2))

  if (finalStatus !== status.FULFILLED) {
    process.exit(1)
  }

  process.exit(0)
}

main()