const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
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
  const files = glob
    .sync('tests/__data__/expected/.gh-pages/**/*.m3u')
    .map(f => f.replace('tests/__data__/expected/', ''))

  files.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })
})

it('can generate logs', () => {
  const files = glob
    .sync('tests/__data__/expected/logs/generators/*.log')
    .map(f => f.replace('tests/__data__/expected/', ''))

  files.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
