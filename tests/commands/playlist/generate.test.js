const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/playlist_generate.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.gh-pages LOGS_DIR=tests/__data__/output/logs/generators npm run playlist:generate',
    { encoding: 'utf8' }
  )
})

it('can generate playlists and logs', () => {
  const playlists = glob
    .sync('tests/__data__/expected/.gh-pages/**/*.m3u')
    .map(f => f.replace('tests/__data__/expected/', ''))

  playlists.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  const logs = glob
    .sync('tests/__data__/expected/logs/generators/*.log')
    .map(f => f.replace('tests/__data__/expected/', ''))

  logs.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
