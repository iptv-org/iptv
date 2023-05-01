const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/playlist_format.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync('DB_DIR=tests/__data__/output npm run playlist:format', {
    encoding: 'utf8'
  })
})

it('can format playlists', () => {
  const files = glob
    .sync('tests/__data__/expected/streams/*.m3u')
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
