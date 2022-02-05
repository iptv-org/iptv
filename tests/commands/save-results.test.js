const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/temp')
  fs.copyFileSync(
    'tests/__data__/input/save-results.channels.db',
    'tests/__data__/temp/channels.db'
  )

  const stdout = execSync(
    'DB_FILEPATH=tests/__data__/temp/channels.db LOGS_PATH=tests/__data__/input/logs/load-streams EPG_CODES_FILEPATH=tests/__data__/input/codes.json node scripts/commands/save-results.js',
    { encoding: 'utf8' }
  )
})

it('can save results', () => {
  const output = content('tests/__data__/temp/channels.db')
  const expected = content('tests/__data__/expected/save-results.channels.db')

  expect(output).toEqual(expected)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return data
    .split('\n')
    .filter(l => l)
    .map(l => {
      return JSON.parse(l)
    })
}
