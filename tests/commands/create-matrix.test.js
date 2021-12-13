const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.copyFileSync('tests/__data__/input/test.db', 'tests/__data__/temp/test.db')
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('can create valid matrix', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db node scripts/commands/create-matrix.js',
    { encoding: 'utf8' }
  )
  expect(result).toBe('::set-output name=matrix::{"cluster_id":[1,3]}\n')
})
