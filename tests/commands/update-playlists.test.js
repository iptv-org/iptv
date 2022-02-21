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

it('can update playlist', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db node scripts/commands/update-playlists.js',
    { encoding: 'utf8' }
  )

  const adPlaylist = fs.readFileSync('tests/__data__/output/channels/ad.m3u', {
    encoding: 'utf8'
  })

  expect(adPlaylist).toBe(`#EXTM3U
#EXTINF:-1 tvg-id="AndorraTV.ad" tvg-country="AD" tvg-language="Catalan" tvg-logo="https://i.imgur.com/kJCjeQ4.png" group-title="General",ATV (720p) [Offline]
https://iptv-all.lanesh4d0w.repl.co/andorra/atv
`)

  const ruPlaylist = fs.readFileSync('tests/__data__/output/channels/ru.m3u', {
    encoding: 'utf8'
  })

  expect(ruPlaylist).toBe(`#EXTM3U
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})
