import { LOGS_DIR, STREAMS_DIR } from '../../constants'
import { loadData, data as apiData } from '../../api'
import { Collection, Logger } from '@freearhey/core'
import { hasValidDomain, isURI, parseIssueBody } from '../../utils'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import { Stream } from '../../models'
import * as sdk from '@iptv-org/sdk'
import { program } from 'commander'

program
  .requiredOption('--body <body>', 'The full markdown body text of the issue')
  .option('--labels <labels>', 'Comma-separated string of label names', '')
  .parse(process.argv)

const { body, labels } = program.opts()

const logsStorage = new Storage(LOGS_DIR)
let streams = new Collection<Stream>()
const errors: string[] = []

async function main() {
  const logger = new Logger()

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  await loadStreams()

  const data = parseIssueBody(body)
  if (labels.includes('streams:add')) {
    if (data.missing('stream_id')) {
      errors.push('The request is missing the "Stream ID"')
      done()
    }

    const streamUrl = data.getString('stream_url')
    if (!streamUrl) {
      errors.push('The request is missing the "Stream URL"')
      done()
    } else if (!isURI(streamUrl) || !hasValidDomain(streamUrl)) {
      errors.push(`The stream URL "${streamUrl}" is invalid`)
    }

    if (streams.includes((_stream: Stream) => _stream.url === streamUrl)) {
      errors.push(`The stream with the URL "${streamUrl}" is already included in the playlists`)
    }

    const streamId = data.getString('stream_id') || ''
    const [channelId, feedId] = streamId.split('@')

    const channel: sdk.Models.Channel | undefined = apiData.channelsKeyById.get(channelId)
    if (!channel) {
      errors.push(`There is no channel with the ID "${channelId}" in the database`)
      done()
    }

    const blocklistRecords: sdk.Models.BlocklistRecord[] | undefined =
      apiData.blocklistRecordsGroupedByChannel.get(channelId)
    if (blocklistRecords) {
      blocklistRecords.forEach((record: sdk.Models.BlocklistRecord) => {
        if (record.reason === 'dmca') {
          errors.push(
            `The channel "${channelId}" has been added to our blocklist due to the claims of the copyright holder: ${record.ref}`
          )
        } else if (record.reason === 'nsfw') {
          errors.push(
            `The channel "${channelId}" has been added to our blocklist due to NSFW content: ${record.ref}`
          )
        }
      })
    }

    const feed: sdk.Models.Feed | undefined = apiData.feedsKeyByStreamId.get(streamId)
    if (!feed) {
      errors.push(
        `There is no feed with the ID "${feedId}" for the "${channelId}" channel in the database`
      )
    }
  } else if (labels.includes('streams:remove')) {
    const streamUrls = data.getString('stream_url') || ''
    if (!streamUrls) {
      errors.push('The request is missing the "Stream URL"')
      done()
    }

    streamUrls
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((link: string) => {
        if (!isURI(link) || !hasValidDomain(link)) {
          errors.push(`The stream URL "${link}" is invalid`)
        }

        const found: Stream = streams.first((_stream: Stream) => _stream.url === link.trim())
        if (!found) {
          errors.push(`The stream with the URL "${link}" is missing from the playlists`)
        }
      })
  } else if (labels.includes('streams:edit')) {
    const streamUrl = data.getString('stream_url')

    if (!streamUrl) {
      errors.push('The request is missing the "Stream URL"')
      done()
    } else if (!isURI(streamUrl) || !hasValidDomain(streamUrl)) {
      errors.push(`The stream URL "${streamUrl}" is invalid`)
      done()
    }

    const stream: Stream = streams.first((_stream: Stream) => _stream.url === streamUrl)
    if (!stream) {
      errors.push(`The stream with the URL "${streamUrl}" is missing from the playlists`)
    }
  }

  done()
}

function done() {
  if (errors.length) {
    let message = 'The request contains error(s):'
    errors.forEach(error => {
      message += `\r\n- ${error}`
    })
    logsStorage.saveSync('errors.txt', message)
    process.exit(1)
  }

  process.exit(0)
}

async function loadStreams() {
  const streamsStorage = new Storage(STREAMS_DIR)
  const parser = new PlaylistParser({
    storage: streamsStorage
  })
  const files = await streamsStorage.list('**/*.m3u')

  streams = await parser.parse(files)
}

main()
