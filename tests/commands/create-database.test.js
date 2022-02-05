const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  const stdout = execSync(
    'DB_FILEPATH=tests/__data__/output/streams.db node scripts/commands/create-database.js --input-dir=tests/__data__/input/channels --max-clusters=1',
    { encoding: 'utf8' }
  )
})

it('can create database', () => {
  let output = content('tests/__data__/output/streams.db')
  let expected = content('tests/__data__/expected/streams.db')

  output = output.map(i => {
    i._id = null
    return i
  })
  expected = expected.map(i => {
    i._id = null
    return i
  })

  expect(output).toEqual(
    expect.arrayContaining([
      expect.objectContaining(expected[0]),
      expect.objectContaining(expected[1]),
      expect.objectContaining(expected[2])
    ])
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
