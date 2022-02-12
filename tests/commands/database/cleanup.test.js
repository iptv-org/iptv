const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/db_cleanup.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync('DB_DIR=tests/__data__/output npm run db:cleanup', {
    encoding: 'utf8'
  })
})

it('can remove broken links from database', () => {
  expect(content('tests/__data__/output/streams.db')).toEqual(
    content('tests/__data__/expected/database/db_cleanup.streams.db')
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
