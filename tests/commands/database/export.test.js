const { execSync } = require('child_process')
const fs = require('fs-extra')
const _ = require('lodash')
const dayjs = require('dayjs')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')
  fs.copyFileSync(
    'tests/__data__/input/database/db_export.streams.db',
    'tests/__data__/output/database/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.api npm run db:export',
    { encoding: 'utf8' }
  )
})

it('can create streams.json', () => {
  let api = content('input/data/streams.json')
  let output = content(`output/.api/streams.json`)
  let expected = content(`expected/.api/streams.json`)

  const samples = {
    unchanged_online: 'https://master.starmena-cloud.com/hls/libyas.m3u8',
    unchanged_error: 'https://iptv-all.lanesh4d0w.repl.co/andorra/atv',
    updated_error: 'http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8',
    added_online: 'https://master.starmena-cloud.com/hls/bbc.m3u8'
  }

  let outputData, savedData

  outputData = output.find(i => i.url === samples['unchanged_online'])
  savedData = api.find(i => i.url === samples['unchanged_online'])
  expect(outputData.added_at).toBe(savedData.added_at)
  expect(outputData.updated_at).toBe(savedData.updated_at)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  outputData = output.find(i => i.url === samples['unchanged_error'])
  savedData = api.find(i => i.url === samples['unchanged_error'])
  expect(outputData.added_at).toBe(savedData.added_at)
  expect(outputData.updated_at).toBe(savedData.updated_at)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  outputData = output.find(i => i.url === samples['updated_error'])
  savedData = api.find(i => i.url === samples['unchanged_error'])
  expect(outputData.added_at).toBe(savedData.added_at)
  expect(dayjs().diff(outputData.updated_at, 'h')).toBe(0)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  outputData = output.find(i => i.url === samples['added_online'])
  expect(dayjs().diff(outputData.added_at, 'h')).toBe(0)
  expect(dayjs().diff(outputData.updated_at, 'h')).toBe(0)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  expect(output.map(item => _.omit(item, ['added_at', 'updated_at', 'checked_at']))).toMatchObject(
    expected.map(item => _.omit(item, ['added_at', 'updated_at', 'checked_at']))
  )
})

function content(filepath) {
  return JSON.parse(
    fs.readFileSync(`tests/__data__/${filepath}`, {
      encoding: 'utf8'
    })
  )
}
