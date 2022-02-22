const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/cluster_load.streams.db',
    'tests/__data__/output/streams.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs/cluster/load npm run cluster:load -- --cluster-id=1 --timeout=1',
    { encoding: 'utf8' }
  )
})

it('return results', () => {
  expect(content('tests/__data__/output/logs/cluster/load/cluster_1.log')).toEqual(
    content('tests/__data__/expected/logs/cluster/load/cluster_1.log')
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
