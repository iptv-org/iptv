const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/temp')
  fs.copyFileSync('tests/__data__/input/database/streams.db', 'tests/__data__/temp/streams.db')

  const stdout = execSync('DB_DIR=tests/__data__/temp node scripts/commands/update-playlists.js', {
    encoding: 'utf8'
  })
})

it('can update playlists', () => {
  const files = glob
    .sync('tests/__data__/expected/channels/*.m3u')
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
