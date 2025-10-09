import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs-extra'

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data LOGS_DIR=tests/__data__/input/readme_update ROOT_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('readme:update', () => {
  it('can update readme.md', () => {
    const cmd = `${ENV_VAR} npm run readme:update`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/PLAYLISTS.md')).toEqual(
      content('tests/__data__/expected/readme_update/playlists.md')
    )
  })
})

function content(filepath: string) {
  return JSON.stringify(fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' }))
}
