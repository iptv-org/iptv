import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import * as glob from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/playlist_generate.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.gh-pages LOGS_DIR=tests/__data__/output/logs npm run playlist:generate',
    { encoding: 'utf8' }
  )
})

it('can generate playlists and logs', () => {
  const playlists = glob
    .sync('tests/__data__/expected/.gh-pages/**/*.m3u')
    .map((file: string) => file.replace('tests/__data__/expected/', ''))

  playlists.forEach((filepath: string) => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  expect(content(`output/logs/generators.log`).split('\n').sort()).toStrictEqual(
    content(`expected/logs/generators.log`).split('\n').sort()
  )
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
