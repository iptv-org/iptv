const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')
  fs.copyFileSync(
    'tests/__data__/input/database/db_clear.streams.db',
    'tests/__data__/output/database/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database npm run db:clear -- --threshold 7',
    {
      encoding: 'utf8'
    }
  )
})

it('can clear database', () => {
  let output = content('tests/__data__/output/database/streams.db')
  let expected = content('tests/__data__/expected/database/db_clear.streams.db')

  output = output.map(i => {
    i._id = null
    return i
  })
  expected = expected.map(i => {
    i._id = null
    return i
  })

  expect(output).toMatchObject(expected)
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
