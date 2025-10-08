import { loadData, data, searchChannels } from '../../api'
import { Collection, Logger } from '@freearhey/core'
import { select, input } from '@inquirer/prompts'
import { Playlist, Stream } from '../../models'
import { Storage } from '@freearhey/storage-js'
import { PlaylistParser } from '../../core'
import nodeCleanup from 'node-cleanup'
import * as sdk from '@iptv-org/sdk'
import { truncate } from '../../utils'
import { Command } from 'commander'
import readline from 'readline'

type ChoiceValue = { type: string; value?: sdk.Models.Feed | sdk.Models.Channel }
type Choice = { name: string; short?: string; value: ChoiceValue; default?: boolean }

if (process.platform === 'win32') {
  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout
    })
    .on('SIGINT', function () {
      process.emit('SIGINT')
    })
}

const program = new Command()

program.argument('<filepath>', 'Path to *.channels.xml file to edit').parse(process.argv)

const filepath = program.args[0]
const logger = new Logger()
const storage = new Storage()
let parsedStreams = new Collection<Stream>()

main(filepath)
nodeCleanup(() => {
  save(filepath)
})

export default async function main(filepath: string) {
  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  logger.info('loading data from api...')
  await loadData()

  logger.info('loading streams...')
  const parser = new PlaylistParser({
    storage
  })
  parsedStreams = await parser.parseFile(filepath)
  const streamsWithoutId = parsedStreams.filter((stream: Stream) => !stream.tvgId)

  logger.info(
    `found ${parsedStreams.count()} streams (including ${streamsWithoutId.count()} without ID)`
  )

  logger.info('starting...\n')

  for (const stream of streamsWithoutId.all()) {
    try {
      stream.tvgId = await selectChannel(stream)
    } catch (err) {
      logger.info(err.message)
      break
    }
  }

  streamsWithoutId.forEach((stream: Stream) => {
    if (stream.channel === '-') {
      stream.channel = ''
    }
  })
}

async function selectChannel(stream: Stream): Promise<string> {
  const query = escapeRegex(stream.title)
  const similarChannels = searchChannels(query)
  const url = truncate(stream.url, 50)

  const selected: ChoiceValue = await select({
    message: `Select channel ID for "${stream.title}" (${url}):`,
    choices: getChannelChoises(similarChannels),
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type': {
      const typedChannelId = await input({ message: '  Channel ID:' })
      if (!typedChannelId) return ''
      const selectedFeedId = await selectFeed(typedChannelId)
      if (selectedFeedId === '-') return typedChannelId
      return [typedChannelId, selectedFeedId].join('@')
    }
    case 'channel': {
      const selectedChannel = selected.value
      if (!selectedChannel) return ''
      const selectedFeedId = await selectFeed(selectedChannel.id)
      if (selectedFeedId === '-') return selectedChannel.id
      return [selectedChannel.id, selectedFeedId].join('@')
    }
  }

  return ''
}

async function selectFeed(channelId: string): Promise<string> {
  const channelFeeds = new Collection(data.feedsGroupedByChannel.get(channelId))
  const choices = getFeedChoises(channelFeeds)

  const selected: ChoiceValue = await select({
    message: `Select feed ID for "${channelId}":`,
    choices,
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type':
      return await input({ message: '  Feed ID:', default: 'SD' })
    case 'feed':
      const selectedFeed = selected.value
      if (!selectedFeed) return ''
      return selectedFeed.id
  }

  return ''
}

function getChannelChoises(channels: Collection<sdk.Models.Channel>): Choice[] {
  const choises: Choice[] = []

  channels.forEach((channel: sdk.Models.Channel) => {
    const names = new Collection([channel.name, ...channel.alt_names]).uniq().join(', ')

    choises.push({
      value: {
        type: 'channel',
        value: channel
      },
      name: `${channel.id} (${names})`,
      short: `${channel.id}`
    })
  })

  choises.push({ name: 'Type...', value: { type: 'type' } })
  choises.push({ name: 'Skip', value: { type: 'skip' } })

  return choises
}

function getFeedChoises(feeds: Collection<sdk.Models.Feed>): Choice[] {
  const choises: Choice[] = []

  feeds.forEach((feed: sdk.Models.Feed) => {
    let name = `${feed.id} (${feed.name})`
    if (feed.is_main) name += ' [main]'

    choises.push({
      value: {
        type: 'feed',
        value: feed
      },
      default: feed.is_main,
      name,
      short: feed.id
    })
  })

  choises.push({ name: 'Type...', value: { type: 'type' } })
  choises.push({ name: 'Skip', value: { type: 'skip' } })

  return choises
}

function save(filepath: string) {
  if (!storage.existsSync(filepath)) return
  const playlist = new Playlist(parsedStreams)
  storage.saveSync(filepath, playlist.toString())
  logger.info(`\nFile '${filepath}' successfully saved`)
}

function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}
