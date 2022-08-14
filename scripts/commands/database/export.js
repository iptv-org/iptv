const { logger, db, api, file } = require('../../core')
const _ = require('lodash')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.api'

async function main() {
  await api.streams.load()
  await db.streams.load()
  const now = dayjs.utc().format()
  let streams = await db.streams.find({})
  streams = _.sortBy(streams, 'channel')
  streams = streams.map(stream => {
    let data = {
      channel: stream.channel,
      url: stream.url,
      http_referrer: stream.http_referrer,
      user_agent: stream.user_agent,
      status: stream.status,
      width: stream.width,
      height: stream.height,
      bitrate: stream.bitrate,
      frame_rate: stream.frame_rate
    }

    let addedAt = now
    let updatedAt = now
    let found = api.streams.find({ url: stream.url })
    if (found) {
      data = JSON.parse(JSON.stringify(data))
      normalized = _.omit(found, ['added_at', 'updated_at', 'checked_at'])
      if (_.isEqual(data, normalized)) {
        addedAt = found.added_at || now
        updatedAt = found.updated_at || now
      } else {
        addedAt = found.added_at || now
        updatedAt = now
      }
    }

    data.added_at = addedAt
    data.updated_at = updatedAt
    data.checked_at = now

    return data
  })

  await file.create(`${PUBLIC_DIR}/streams.json`, JSON.stringify(streams))
}

main()
