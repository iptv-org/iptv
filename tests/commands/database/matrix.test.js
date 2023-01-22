const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')
  fs.copyFileSync(
    'tests/__data__/input/database/db_matrix.streams.db',
    'tests/__data__/output/database/streams.db'
  )
})

it('can create valid matrix', () => {
  const result = execSync('DB_DIR=tests/__data__/output/database npm run db:matrix', {
    encoding: 'utf8'
  })
  expect(result).toBe(
    '\n> db:matrix\n> node scripts/commands/database/matrix.js\n\nMATRIX={"cluster_id":[1,3]}\n'
  )
})
