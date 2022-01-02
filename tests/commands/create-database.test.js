const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
})

it('can create database', () => {
  execSync(
    'DB_FILEPATH=tests/__data__/output/test.db node scripts/commands/create-database.js --input-dir=tests/__data__/input/channels --max-clusters=1',
    { encoding: 'utf8' }
  )

  const database = fs.readFileSync(path.resolve('tests/__data__/output/test.db'), {
    encoding: 'utf8'
  })
  const item = database.split('\n').find(i => i.includes('ATV.ad'))
  expect(JSON.parse(item)).toMatchObject({
    name: 'ATV',
    id: 'ATV.ad',
    filepath: 'tests/__data__/input/channels/ad_example.m3u',
    src_country: { name: 'Andorra', code: 'AD', lang: 'cat' },
    tvg_country: 'AD',
    countries: [{ name: 'Andorra', code: 'AD', lang: 'cat' }],
    regions: [
      { name: 'Europe, the Middle East and Africa', code: 'EMEA' },
      { name: 'Europe', code: 'EUR' },
      { name: 'Worldwide', code: 'INT' }
    ],
    languages: [{ name: 'Catalan', code: 'cat' }],
    categories: [{ name: 'General', slug: 'general', nsfw: false }],
    tvg_url: '',
    guides: [],
    logo: 'https://i.imgur.com/kJCjeQ4.png',
    resolution: { height: 720, width: null },
    status: { label: 'Offline', code: 'offline', level: 5 },
    url: 'https://iptv-all.lanesh4d0w.repl.co/andorra/atv',
    http: { referrer: '', 'user-agent': '' },
    is_nsfw: false,
    is_broken: true,
    updated: false,
    cluster_id: 1
  })
})
