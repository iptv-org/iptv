const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.emptyDirSync('tests/__data__/temp')
  fs.copyFileSync(
    'tests/__data__/input/database/generate-playlists.streams.db',
    'tests/__data__/temp/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/temp DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.gh-pages LOGS_DIR=tests/__data__/output/logs/generators node --trace-warnings scripts/commands/generate-playlists.js',
    { encoding: 'utf8' }
  )

  console.log(stdout)
})

it('can generate playlists', () => {
  const files = [
    '.gh-pages/categories/general.m3u',
    '.gh-pages/categories/legislative.m3u',
    '.gh-pages/categories/news.m3u',
    '.gh-pages/categories/undefined.m3u',
    'logs/generators/categories.log',
    '.gh-pages/countries/ru.m3u',
    '.gh-pages/countries/uk.m3u',
    '.gh-pages/countries/undefined.m3u',
    'logs/generators/countries.log',
    '.gh-pages/languages/cat.m3u',
    '.gh-pages/languages/eng.m3u',
    '.gh-pages/languages/nld.m3u',
    '.gh-pages/languages/rus.m3u',
    '.gh-pages/languages/undefined.m3u',
    'logs/generators/languages.log',
    '.gh-pages/regions/asia.m3u',
    '.gh-pages/regions/cis.m3u',
    '.gh-pages/regions/emea.m3u',
    '.gh-pages/regions/eur.m3u',
    '.gh-pages/regions/int.m3u',
    '.gh-pages/regions/undefined.m3u',
    'logs/generators/regions.log'
  ]

  files.forEach(filepath => {
    expect(content(`output/${filepath}`)).toBe(content(`expected/${filepath}`))
  })
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
