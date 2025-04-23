import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import os from 'os'

let ENV_VAR =
  'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/api_generate API_DIR=tests/__data__/output/.api'
if (os.platform() === 'win32') {
  ENV_VAR =
    'SET "DATA_DIR=tests/__data__/input/data" && SET "STREAMS_DIR=tests/__data__/input/api_generate" && SET "API_DIR=tests/__data__/output/.api" &&'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('api:generate', () => {
  it('can create streams.json', () => {
    const cmd = `${ENV_VAR} npm run api:generate`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/.api/streams.json')).toMatchObject(
      content('tests/__data__/expected/api_generate/.api/streams.json')
    )
  })
})

function content(filepath: string) {
  return JSON.parse(fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' }))
}
