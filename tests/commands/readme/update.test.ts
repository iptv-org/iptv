import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/.readme')
  fs.copyFileSync(
    'tests/__data__/input/.readme/config.json',
    'tests/__data__/output/.readme/config.json'
  )
  fs.copyFileSync(
    'tests/__data__/input/.readme/template.md',
    'tests/__data__/output/.readme/template.md'
  )

  execSync(
    'DATA_DIR=tests/__data__/input/data LOGS_DIR=tests/__data__/input/logs README_DIR=tests/__data__/output/.readme npm run readme:update',
    { encoding: 'utf8' }
  )
})

it('can update readme.md', () => {
  expect(content('tests/__data__/output/readme.md')).toEqual(
    content('tests/__data__/expected/_readme.md')
  )
})

function content(filepath: string) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
