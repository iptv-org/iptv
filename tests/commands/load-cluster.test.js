const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.emptyDirSync('tests/__data__/temp')
  fs.copyFileSync('tests/__data__/input/database/streams.db', 'tests/__data__/temp/streams.db')

  const stdout = execSync(
    'DB_DIR=tests/__data__/temp LOGS_DIR=tests/__data__/output/logs/load-cluster node scripts/commands/load-cluster.js --cluster-id=1 --timeout=1',
    { encoding: 'utf8' }
  )
})

it('return results', () => {
  let output = content('tests/__data__/output/logs/load-cluster/cluster_1.log')
  let expected = content('tests/__data__/expected/logs/load-cluster/cluster_1.log')

  expect(output).toEqual(expected)
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
