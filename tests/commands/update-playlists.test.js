const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/temp')
  fs.copyFileSync('tests/__data__/input/streams.db', 'tests/__data__/temp/streams.db')

  const stdout = execSync(
    'DB_FILEPATH=tests/__data__/temp/streams.db node scripts/commands/update-playlists.js',
    { encoding: 'utf8' }
  )
})

it('can update playlist', () => {
  const output1 = content('tests/__data__/output/channels/ad.m3u')
  const expected1 = content('tests/__data__/expected/channels/ad.m3u')

  expect(output1).toBe(expected1)

  const output2 = content('tests/__data__/output/channels/ru.m3u')
  const expected2 = content('tests/__data__/expected/channels/ru.m3u')

  expect(output2).toBe(expected2)

  const output3 = content('tests/__data__/output/channels/uk.m3u')
  const expected3 = content('tests/__data__/expected/channels/uk.m3u')

  expect(output3).toBe(expected3)
})

function content(filepath) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
