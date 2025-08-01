import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import os from 'os'

let ENV_VAR =
  'DATA_DIR=tests/__data__/input/data LOGS_DIR=tests/__data__/input/readme_update README_DIR=tests/__data__/output/.readme'
if (os.platform() === 'win32') {
  ENV_VAR =
    'SET "DATA_DIR=tests/__data__/input/data" && SET "LOGS_DIR=tests/__data__/input/readme_update" && SET "README_DIR=tests/__data__/output/.readme" &&'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/.readme')
  fs.copyFileSync(
    'tests/__data__/input/readme_update/.readme/config.json',
    'tests/__data__/output/.readme/config.json'
  )
  fs.copyFileSync(
    'tests/__data__/input/readme_update/.readme/template.md',
    'tests/__data__/output/.readme/template.md'
  )
})

describe('readme:update', () => {
  it('can update readme.md', () => {
    const cmd = `${ENV_VAR} npm run readme:update`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/playlists.md')).toEqual(
      content('tests/__data__/expected/readme_update/playlists.md')
    )
  })
})

function content(filepath: string) {
  return JSON.stringify(fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' }))
}
