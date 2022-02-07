const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  fs.copyFileSync('tests/__data__/input/database/streams.db', 'tests/__data__/output/streams.db')
})

it('can create valid matrix', () => {
  const result = execSync('DB_DIR=tests/__data__/output node scripts/commands/create-matrix.js', {
    encoding: 'utf8'
  })
  expect(result).toBe('::set-output name=matrix::{"cluster_id":[1,3]}\n')
})
