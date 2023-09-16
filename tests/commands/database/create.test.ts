import * as fs from 'fs-extra'
import * as path from 'path'
import { execSync } from 'child_process'
import * as _ from 'lodash'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams npm run db:create',
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

  expect(_.orderBy(output, 'name')).toMatchObject(
    expect.arrayContaining(_.orderBy(expected, 'name'))
  )
})

function content(filepath: string) {
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
