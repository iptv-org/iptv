const { execSync } = require('child_process')
const fs = require('fs-extra')
const _ = require('lodash')
const dayjs = require('dayjs')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/db_export.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.api npm run db:export',
    { encoding: 'utf8' }
  )
})

it('can create streams.json', () => {
  let api = content('input/data/streams.json')
  let output = content(`output/.api/streams.json`)
  let expected = content(`expected/.api/streams.json`)

  const updatedUrl = 'https://master.starmena-cloud.com/hls/libyas.m3u8'
  let outputData = output.find(i => i.url === updatedUrl)
  let savedData = api.find(i => i.url === updatedUrl)
  expect(outputData.added_at).toBe(savedData.added_at)
  expect(outputData.updated_at).toBe(savedData.updated_at)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  const sameUrl = 'http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8'
  outputData = output.find(i => i.url === sameUrl)
  savedData = api.find(i => i.url === sameUrl)
  expect(outputData.added_at).toBe(savedData.added_at)
  expect(dayjs().diff(outputData.updated_at, 'h')).toBe(0)
  expect(dayjs().diff(outputData.checked_at, 'h')).toBe(0)

  const addedUrl = 'https://master.starmena-cloud.com/hls/bbc.m3u8'
  outputData = output.find(i => i.url === addedUrl)
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
