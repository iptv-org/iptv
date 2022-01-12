const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.copyFileSync('tests/__data__/input/generate-playlists.test.db', 'tests/__data__/temp/test.db')

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
  expect(content('output/.gh-pages/categories/general.m3u'))
    .toBe(content('expected/.gh-pages/categories/general.m3u'))

  expect(content('output/.gh-pages/categories/legislative.m3u'))
    .toBe(content('expected/.gh-pages/categories/legislative.m3u'))

  expect(content('output/.gh-pages/categories/news.m3u'))
    .toBe(content('expected/.gh-pages/categories/news.m3u'))
})

it('can generate countries', () => {
  expect(content('output/.gh-pages/countries/ru.m3u'))
    .toBe(content('expected/.gh-pages/countries/ru.m3u'))

  expect(content('output/.gh-pages/countries/uk.m3u'))
    .toBe(content('expected/.gh-pages/countries/uk.m3u'))
})

it('can generate languages', () => {
  expect(content('output/.gh-pages/languages/rus.m3u'))
    .toBe(content('expected/.gh-pages/languages/rus.m3u'))

  expect(content('output/.gh-pages/languages/eng.m3u'))
    .toBe(content('expected/.gh-pages/languages/eng.m3u'))
})

it('can generate regions', () => {
  expect(content('output/.gh-pages/regions/asia.m3u'))
    .toBe(content('expected/.gh-pages/regions/asia.m3u'))

  expect(content('output/.gh-pages/regions/cis.m3u'))
    .toBe(content('expected/.gh-pages/regions/cis.m3u'))

  expect(content('output/.gh-pages/regions/emea.m3u'))
    .toBe(content('expected/.gh-pages/regions/emea.m3u'))

  expect(content('output/.gh-pages/regions/eur.m3u'))
    .toBe(content('expected/.gh-pages/regions/eur.m3u'))

  expect(content('output/.gh-pages/regions/int.m3u'))
    .toBe(content('expected/.gh-pages/regions/int.m3u'))
})

it('can generate channels.json', () => {
  expect(content('output/.gh-pages/channels.json'))
    .toBe(content('expected/.gh-pages/channels.json'))
})

it('can generate index.category.m3u', () => {
  expect(content('output/.gh-pages/index.category.m3u'))
    .toBe(content('expected/.gh-pages/index.category.m3u'))
})

it('can generate index.country.m3u', () => {
  expect(content('output/.gh-pages/index.country.m3u'))
    .toBe(content('expected/.gh-pages/index.country.m3u'))
})

it('can generate index.language.m3u', () => {
  expect(content('output/.gh-pages/index.language.m3u'))
    .toBe(content('expected/.gh-pages/index.language.m3u'))
})

it('can generate index.region.m3u', () => {
  expect(content('output/.gh-pages/index.region.m3u'))
    .toBe(content('expected/.gh-pages/index.region.m3u'))
})

it('can generate index.m3u', () => {
  expect(content('output/.gh-pages/index.m3u'))
    .toBe(content('expected/.gh-pages/index.m3u'))
})

it('can generate index.nsfw.m3u', () => {
  expect(content('output/.gh-pages/index.nsfw.m3u'))
    .toBe(content('expected/.gh-pages/index.nsfw.m3u'))
})

it('can generate logs categories', () => {
  expect(content('output/logs/generate-playlists/categories.log'))
    .toBe(content('expected/logs/generate-playlists/categories.log'))
})

it('can generate logs countries', () => {
  expect(content('output/logs/generate-playlists/countries.log'))
    .toBe(content('expected/logs/generate-playlists/countries.log'))
})

it('can generate logs languages', () => {
  expect(content('output/logs/generate-playlists/languages.log'))
    .toBe(content('expected/logs/generate-playlists/languages.log'))
})

it('can generate logs regions', () => {
  expect(content('output/logs/generate-playlists/regions.log'))
    .toBe(content('expected/logs/generate-playlists/regions.log'))
})
