const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')
  fs.copyFileSync(
    'tests/__data__/input/database/db_update.streams.db',
    'tests/__data__/output/database/streams.db'
  )
})

it('can save results', () => {
  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database LOGS_DIR=tests/__data__/input/logs/cluster/load npm run db:update',
    { encoding: 'utf8' }
  )
  expect(stdout).toEqual(`
> db:update
> node scripts/commands/database/update.js

loading streams...
found 10 streams
loading check results...
found 6 results
loading origins...
found 2 origins
updating streams...
updated 6 streams
done
`)

  let input = content('tests/__data__/input/database/db_update.streams.db')
  let output = content('tests/__data__/output/database/streams.db')
  let expected = content('tests/__data__/expected/database/db_update.streams.db')

  let inputDate = input.find(i => i._id === '2ST8btby3mmsgPF0')['updated_at']
  let outputDate = output.find(i => i._id === '2ST8btby3mmsgPF0')['updated_at']

  expect(outputDate).not.toEqual(inputDate)

  output = output.map(i => {
    delete i['updated_at']
    return i
  })
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
