const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/test.db', 'tests/__data__/temp/test.db')
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('return results if stream with error', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db LOGS_PATH=tests/__data__/output/logs node scripts/commands/check-streams.js --cluster-id=1 --timeout=1',
    { encoding: 'utf8' }
  )
  const logs = fs.readFileSync(
    path.resolve('tests/__data__/output/logs/check-streams/cluster_1.log'),
    {
      encoding: 'utf8'
    }
  )
  const lines = logs.split('\n')
  expect(JSON.parse(lines[0])).toMatchObject({
    _id: '2ST8btby3mmsgPF0',
    url: 'http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8',
    http: { referrer: '', 'user-agent': '' },
    error: 'Operation timed out',
    streams: [],
    requests: []
  })
  expect(JSON.parse(lines[1])).toMatchObject({
    _id: 'I6cjG2xCBRFFP4sz',
    url: 'https://iptv-all.lanesh4d0w.repl.co/andorra/atv',
    http: { referrer: '', 'user-agent': '' },
    error: 'Operation timed out',
    streams: [],
    requests: []
  })
})
