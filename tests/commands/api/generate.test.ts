import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs-extra'

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/api_generate API_DIR=tests/__data__/output/.api'

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
