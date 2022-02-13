const { execSync } = require('child_process')
const fs = require('fs-extra')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/db_export.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output PUBLIC_DIR=tests/__data__/output/.gh-pages npm run db:export',
    { encoding: 'utf8' }
  )
})

it('can create streams.json', () => {
  expect(content(`output/.gh-pages/streams.json`)).toBe(content(`expected/.gh-pages/streams.json`))
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
