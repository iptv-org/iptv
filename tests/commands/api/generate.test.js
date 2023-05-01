const { execSync } = require('child_process')
const fs = require('fs-extra')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database')
  fs.copyFileSync(
    'tests/__data__/input/database/api_generate.streams.db',
    'tests/__data__/output/database/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.api npm run api:generate',
    { encoding: 'utf8' }
  )
})

it('can create streams.json', () => {
  expect(content(`output/.api/streams.json`)).toMatchObject(content(`expected/.api/streams.json`))
})

function content(filepath) {
  return JSON.parse(
    fs.readFileSync(`tests/__data__/${filepath}`, {
      encoding: 'utf8'
    })
  )
}
