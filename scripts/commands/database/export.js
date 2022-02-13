const { logger, db, file } = require('../../core')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'

async function main() {
  await db.streams.load()
  let streams = await db.streams.find({})
  streams = _.sortBy(streams, 'channel_id')
  streams = streams.map(stream => {
    return {
      channel: stream.channel_id,
      display_name: stream.display_name,
      url: stream.url,
      http_referrer: stream.http['referrer'],
      user_agent: stream.http['user-agent']
    }
  })

  await file.create(`${PUBLIC_DIR}/streams.json`, JSON.stringify(streams))
}

main()
