import { Storage, Collection, Logger, Dictionary } from '@freearhey/core'
import { DataLoader, DataProcessor, PlaylistParser } from '../../core'
import type { ChannelSearchableData } from '../../types/channel'
import { Channel, Feed, Playlist, Stream } from '../../models'
import { DataProcessorData } from '../../types/dataProcessor'
import { DataLoaderData } from '../../types/dataLoader'
import { select, input } from '@inquirer/prompts'
import { DATA_DIR } from '../../constants'
import nodeCleanup from 'node-cleanup'
import sjs from '@freearhey/search-js'
import { Command } from 'commander'
import readline from 'readline'

type ChoiceValue = { type: string; value?: Feed | Channel }
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
let parsedStreams = new Collection()

main(filepath)
nodeCleanup(() => {
  save(filepath)
})

export default async function main(filepath: string) {
  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  logger.info('loading data from api...')
  const processor = new DataProcessor()
  const dataStorage = new Storage(DATA_DIR)
  const loader = new DataLoader({ storage: dataStorage })
  const data: DataLoaderData = await loader.load()
  const {
    channels,
    channelsKeyById,
    feedsGroupedByChannelId,
    logosGroupedByStreamId
  }: DataProcessorData = processor.process(data)

  logger.info('loading streams...')
  const parser = new PlaylistParser({
    storage,
    feedsGroupedByChannelId,
    logosGroupedByStreamId,
    channelsKeyById
  })
  parsedStreams = await parser.parseFile(filepath)
  const streamsWithoutId = parsedStreams.filter((stream: Stream) => !stream.id)

  logger.info(
    `found ${parsedStreams.count()} streams (including ${streamsWithoutId.count()} without ID)`
  )

  logger.info('creating search index...')
  const items = channels.map((channel: Channel) => channel.getSearchable()).all()
  const searchIndex = sjs.createIndex(items, {
    searchable: ['name', 'altNames', 'guideNames', 'streamTitles', 'feedFullNames']
  })

  logger.info('starting...\n')

  for (const stream of streamsWithoutId.all()) {
    try {
      stream.id = await selectChannel(stream, searchIndex, feedsGroupedByChannelId, channelsKeyById)
    } catch (err) {
      logger.info(err.message)
      break
    }
  }

  streamsWithoutId.forEach((stream: Stream) => {
    if (stream.id === '-') {
      stream.id = ''
    }
  })
}

async function selectChannel(
  stream: Stream,
  searchIndex,
  feedsGroupedByChannelId: Dictionary,
  channelsKeyById: Dictionary
): Promise<string> {
  const query = escapeRegex(stream.getTitle())
  const similarChannels = searchIndex
    .search(query)
    .map((item: ChannelSearchableData) => channelsKeyById.get(item.id))

  const url = stream.url.length > 50 ? stream.url.slice(0, 50) + '...' : stream.url

  const selected: ChoiceValue = await select({
    message: `Select channel ID for "${stream.title}" (${url}):`,
    choices: getChannelChoises(new Collection(similarChannels)),
    pageSize: 10
  })

  switch (selected.type) {
    case 'skip':
      return '-'
    case 'type': {
      const typedChannelId = await input({ message: '  Channel ID:' })
      if (!typedChannelId) return ''
      const selectedFeedId = await selectFeed(typedChannelId, feedsGroupedByChannelId)
      if (selectedFeedId === '-') return typedChannelId
      return [typedChannelId, selectedFeedId].join('@')
    }
    case 'channel': {
      const selectedChannel = selected.value
      if (!selectedChannel) return ''
      const selectedFeedId = await selectFeed(selectedChannel.id, feedsGroupedByChannelId)
      if (selectedFeedId === '-') return selectedChannel.id
      return [selectedChannel.id, selectedFeedId].join('@')
    }
  }

  return ''
}

async function selectFeed(channelId: string, feedsGroupedByChannelId: Dictionary): Promise<string> {
  const channelFeeds = new Collection(feedsGroupedByChannelId.get(channelId)) || new Collection()
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

function getChannelChoises(channels: Collection): Choice[] {
  const choises: Choice[] = []

  channels.forEach((channel: Channel) => {
    const names = new Collection([channel.name, ...channel.altNames.all()]).uniq().join(', ')

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

function getFeedChoises(feeds: Collection): Choice[] {
  const choises: Choice[] = []

  feeds.forEach((feed: Feed) => {
    let name = `${feed.id} (${feed.name})`
    if (feed.isMain) name += ' [main]'

    choises.push({
      value: {
        type: 'feed',
        value: feed
      },
      default: feed.isMain,
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
