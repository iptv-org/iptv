const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database DATA_DIR=tests/__data__/input/data npm run db:create -- --input-dir=tests/__data__/input/streams',
    { encoding: 'utf8' }
  )
})

it('can create database', () => {
  let output = content('tests/__data__/output/database/streams.db')
  let expected = content('tests/__data__/expected/database/db_create.streams.db')

  output = output.map(i => {
    i._id = null
    return i
  })
  expected = expected.map(i => {
    i._id = null
    return i
  })

  expect(output).toMatchObject(expect.arrayContaining(expected))
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
