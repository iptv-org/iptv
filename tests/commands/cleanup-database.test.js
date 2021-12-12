const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.copyFileSync('tests/__data__/input/test.db', 'tests/__data__/temp/test.db')
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('can remove broken links from database', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db node scripts/commands/cleanup-database.js',
    { encoding: 'utf8' }
  )

  const database = fs.readFileSync('tests/__data__/temp/test.db', { encoding: 'utf8' })
  const lines = database.split('\n')
  expect(lines[0]).toBe(
    `{"name":"ЛДПР ТВ","id":"LDPRTV.ru","filepath":"tests/__data__/output/channels/ru.m3u","src_country":{"name":"Russia","code":"RU","lang":"rus"},"tvg_country":"RU","countries":[{"name":"Russia","code":"RU","lang":"rus"}],"regions":[{"name":"Asia","code":"ASIA"},{"name":"Commonwealth of Independent States","code":"CIS"},{"name":"Europe, the Middle East and Africa","code":"EMEA"},{"name":"Europe","code":"EUR"}],"languages":[{"name":"Russian","code":"rus"}],"categories":[{"name":"General","slug":"general","nsfw":false}],"tvg_url":"","guides":["https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"],"logo":"https://iptvx.one/icn/ldpr-tv.png","resolution":{"height":1080,"width":null},"status":{"label":"","code":"online","level":1},"url":"http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8","http":{"referrer":"","user-agent":""},"is_nsfw":false,"is_broken":false,"updated":false,"cluster_id":1,"_id":"2ST8btby3mmsgPF0"}`
  )
})
