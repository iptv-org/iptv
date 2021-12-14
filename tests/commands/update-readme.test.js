const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync(path.resolve('tests/__data__/output'), { recursive: true })
})

it('can update readme.md', () => {
  const result = execSync(
    'LOGS_PATH=tests/__data__/input/logs node scripts/commands/update-readme.js --config=tests/__data__/input/readme.json',
    { encoding: 'utf8' }
  )

  const readme = fs.readFileSync(path.resolve('tests/__data__/output/readme.md'), {
    encoding: 'utf8'
  })
  const expected = fs.readFileSync(path.resolve('tests/__data__/input/readme.md'), {
    encoding: 'utf8'
  })

  expect(readme).toBe(expected)
})
