const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/db_update.streams.db',
    'tests/__data__/output/streams.db'
  )
})

it('can save results', () => {
  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/input/logs/cluster/load npm run db:update',
    { encoding: 'utf8' }
  )
  expect(stdout).toEqual(`
> db:update
> node scripts/commands/database/update.js

loading streams...
found 7 streams
loading check results...
found 6 results
loading origins...
found 2 origins
updating streams...
updated 6 streams
removed 1 duplicates
done
`)

  expect(content('tests/__data__/output/streams.db')).toEqual(
    content('tests/__data__/expected/database/db_update.streams.db')
  )
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
