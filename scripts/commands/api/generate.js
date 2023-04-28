const { logger, db, file } = require('../../core')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.api'

async function main() {
  logger.info(`loading streams...`)
  await db.streams.load()

  let streams = await db.streams.find({})
  streams = _.sortBy(streams, 'channel')
  streams = streams.map(stream => {
    let data = {
      channel: stream.channel,
      url: stream.url,
      http_referrer: stream.http_referrer,
      user_agent: stream.user_agent
    }

    return data
  })
  logger.info(`found ${streams.length} streams`)

  logger.info('saving to .api/streams.json...')
  await file.create(`${PUBLIC_DIR}/streams.json`, JSON.stringify(streams))
}

main()
