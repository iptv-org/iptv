const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
  fs.copyFileSync('tests/__data__/input/update-database.test.db', 'tests/__data__/temp/test.db')
})

it('can update database', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db LOGS_PATH=tests/__data__/input/logs EPG_CODES_FILEPATH=tests/__data__/input/codes.json node scripts/commands/update-database.js',
    { encoding: 'utf8' }
  )
  const database = fs.readFileSync('tests/__data__/temp/test.db', { encoding: 'utf8' })
  const lines = database.split('\n')
  expect(JSON.parse(lines[0])).toMatchObject({
    name: 'ЛДПР ТВ',
    id: 'LDPRTV.ru',
    filepath: 'tests/__data__/output/channels/ru.m3u',
    src_country: { name: 'Russia', code: 'RU', lang: 'rus' },
    tvg_country: 'RU',
    countries: [{ name: 'Russia', code: 'RU', lang: 'rus' }],
    regions: [
      { name: 'Asia', code: 'ASIA' },
      { name: 'Commonwealth of Independent States', code: 'CIS' },
      { name: 'Europe, the Middle East and Africa', code: 'EMEA' },
      { name: 'Europe', code: 'EUR' }
    ],
    languages: [{ name: 'Russian', code: 'rus' }],
    categories: [{ name: 'General', slug: 'general', nsfw: false }],
    tvg_url: '',
    guides: ['https://iptv-org.github.io/epg/guides/ru/tv.yandex.ru.epg.xml'],
    logo: 'https://iptvx.one/icn/ldpr-tv.png',
    resolution: { height: 1080, width: 1920 },
    status: { label: '', code: 'online', level: 1 },
    url: 'http://46.46.143.222:1935/live/mp4:ldpr.stream/playlist.m3u8',
    http: { referrer: '', 'user-agent': '' },
    is_nsfw: false,
    is_broken: false,
    updated: true,
    cluster_id: 1,
    _id: '2ST8btby3mmsgPF0'
  })
  expect(JSON.parse(lines[1])).toMatchObject({
    name: 'BBC News HD',
    id: 'BBCNews.uk',
    filepath: 'tests/__data__/output/channels/uk.m3u',
    src_country: { name: 'United Kingdom', code: 'UK', lang: 'eng' },
    tvg_country: 'UK',
    countries: [{ name: 'United Kingdom', code: 'UK', lang: 'eng' }],
    regions: [
      { name: 'Europe, the Middle East and Africa', code: 'EMEA' },
      { name: 'Europe', code: 'EUR' }
    ],
    languages: [{ name: 'English', code: 'eng' }],
    categories: [{ name: 'News', slug: 'news', nsfw: false }],
    tvg_url: '',
    guides: [],
    logo: 'https://i.imgur.com/eNPIQ9f.png',
    resolution: { height: 720, width: null },
    status: { label: 'Not 24/7', code: 'not_247', level: 3 },
    url: 'http://1111296894.rsc.cdn77.org/LS-ATL-54548-6/index.m3u8',
    http: { referrer: '', 'user-agent': '' },
    is_nsfw: false,
    is_broken: false,
    updated: false,
    cluster_id: 3,
    _id: '3TbieV1ptnZVCIdn'
  })
  expect(JSON.parse(lines[2])).toMatchObject({
    name: 'ATV',
    id: 'AndorraTV.ad',
    filepath: 'tests/__data__/output/channels/ad.m3u',
    src_country: { name: 'Andorra', code: 'AD', lang: 'cat' },
    tvg_country: 'AD',
    countries: [{ name: 'Andorra', code: 'AD', lang: 'cat' }],
    regions: [
      { name: 'Europe, the Middle East and Africa', code: 'EMEA' },
      { name: 'Europe', code: 'EUR' }
    ],
    languages: [{ name: 'Catalan', code: 'cat' }],
    categories: [{ name: 'General', slug: 'general', nsfw: false }],
    tvg_url: '',
    guides: ['https://iptv-org.github.io/epg/guides/ad/andorradifusio.ad.epg.xml'],
    logo: 'https://i.imgur.com/kJCjeQ4.png',
    resolution: { height: 720, width: null },
    status: { label: 'Offline', code: 'offline', level: 5 },
    url: 'https://iptv-all.lanesh4d0w.repl.co/andorra/atv',
    http: { referrer: '', 'user-agent': '' },
    is_nsfw: false,
    is_broken: true,
    updated: true,
    cluster_id: 1
  })
  expect(JSON.parse(lines[4])).toMatchObject({
    id: 'KayhanTV.af',
    status: { label: 'Geo-blocked', code: 'geo_blocked', level: 2 },
    is_broken: false,
    updated: false
  })
  expect(JSON.parse(lines[5])).toMatchObject({
    id: 'Sharq.af',
    status: { label: 'Offline', code: 'offline', level: 5 },
    is_broken: true,
    updated: true
  })
})
