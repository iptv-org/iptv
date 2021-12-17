const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function content(filepath) {
  return fs.readFileSync(`tests/__data__/output/${filepath}`, {
    encoding: 'utf8'
  })
}

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.copyFileSync('tests/__data__/input/test.db', 'tests/__data__/temp/test.db')

  execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db PUBLIC_PATH=tests/__data__/output/.gh-pages LOGS_PATH=tests/__data__/output/logs node scripts/commands/generate-playlists.js',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('can generate categories', () => {
  expect(content('.gh-pages/categories/general.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/categories/news.m3u')).toBe(`#EXTM3U x-tvg-url=""
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
`)
})

it('can generate countries', () => {
  expect(content('.gh-pages/countries/ru.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/countries/uk.m3u')).toBe(`#EXTM3U x-tvg-url=""
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
`)
})

it('can generate languages', () => {
  expect(content('.gh-pages/languages/rus.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/languages/eng.m3u')).toBe(`#EXTM3U x-tvg-url=""
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
`)
})

it('can generate regions', () => {
  expect(content('.gh-pages/regions/asia.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/regions/cis.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/regions/emea.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)

  expect(content('.gh-pages/regions/eur.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate channels.json', () => {
  expect(content('.gh-pages/channels.json')).toBe(
    `[{"name":"BBC News HD","logo":"https://i.imgur.com/eNPIQ9f.png","url":"http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8","categories":[{"name":"News","slug":"news"}],"countries":[{"name":"United Kingdom","code":"UK"}],"languages":[{"name":"English","code":"eng"}],"tvg":{"id":"BBCNews.uk","name":"BBC News HD","url":""}},{"name":"ЛДПР ТВ","logo":"https://iptvx.one/icn/ldpr-tv.png","url":"http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8","categories":[{"name":"General","slug":"general"}],"countries":[{"name":"Russia","code":"RU"}],"languages":[{"name":"Russian","code":"rus"}],"tvg":{"id":"LDPRTV.ru","name":"ЛДПР ТВ","url":"https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"}}]`
  )
})

it('can generate index.category.m3u', () => {
  expect(content('.gh-pages/index.category.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate index.country.m3u', () => {
  expect(content('.gh-pages/index.country.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Russia",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="United Kingdom",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
`)
})

it('can generate index.language.m3u', () => {
  expect(content('.gh-pages/index.language.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="English",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Russian",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate index.region.m3u', () => {
  expect(content('.gh-pages/index.region.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Asia",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Commonwealth of Independent States",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="Europe",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Europe",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="Europe, the Middle East and Africa",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="Europe, the Middle East and Africa",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate index.m3u', () => {
  expect(content('.gh-pages/index.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate index.nsfw.m3u', () => {
  expect(content('.gh-pages/index.nsfw.m3u'))
    .toBe(`#EXTM3U x-tvg-url="https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml"
#EXTINF:-1 tvg-id="BBCNews.uk" tvg-country="UK" tvg-language="English" tvg-logo="https://i.imgur.com/eNPIQ9f.png" group-title="News",BBC News HD (720p) [Not 24/7]
http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8
#EXTINF:-1 tvg-id="LDPRTV.ru" tvg-country="RU" tvg-language="Russian" tvg-logo="https://iptvx.one/icn/ldpr-tv.png" group-title="General",ЛДПР ТВ (1080p)
http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8
`)
})

it('can generate logs categories', () => {
  expect(content('logs/generate-playlists/categories.log'))
    .toBe(`{"name":"General","slug":"general","count":1}
{"name":"News","slug":"news","count":1}
{"name":"Other","slug":"other","count":0}
`)
})

it('can generate logs countries', () => {
  expect(content('logs/generate-playlists/countries.log'))
    .toBe(`{"name":"Andorra","code":"AD","count":0}
{"name":"Russia","code":"RU","count":1}
{"name":"United Kingdom","code":"UK","count":1}
{"name":"International","code":"INT","count":0}
{"name":"Undefined","code":"UNDEFINED","count":0}
`)
})

it('can generate logs languages', () => {
  expect(content('logs/generate-playlists/languages.log'))
    .toBe(`{"name":"Catalan","code":"cat","count":0}
{"name":"English","code":"eng","count":1}
{"name":"Russian","code":"rus","count":1}
{"name":"Undefined","code":"undefined","count":0}
`)
})

it('can generate logs regions', () => {
  expect(content('logs/generate-playlists/regions.log'))
    .toBe(`{"name":"Asia","code":"ASIA","count":1}
{"name":"Commonwealth of Independent States","code":"CIS","count":1}
{"name":"Europe","code":"EUR","count":2}
{"name":"Europe, the Middle East and Africa","code":"EMEA","count":2}
{"name":"Undefined","code":"UNDEFINED","count":0}
`)
})
