import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/output/streams'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_update', 'tests/__data__/output/streams')
})

describe('playlist:update', () => {
  it('can update playlists', () => {
    const cmd = `${ENV_VAR} npm run playlist:update --silent`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob.sync('tests/__data__/expected/playlist_update/*.m3u').map(filepath => {
      const fileUrl = pathToFileURL(filepath).toString()
      const pathToRemove = pathToFileURL('tests/__data__/expected/playlist_update/').toString()

      return fileUrl.replace(pathToRemove, '')
    })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/streams/${filepath}`)).toBe(
        content(`tests/__data__/expected/playlist_update/${filepath}`)
      )
    })

    expect(stdout).toBe(
      'OUTPUT=closes #14151, closes #14150, closes #14110, closes #14120, closes #14175, closes #14105, closes #14104, closes #14057, closes #14034, closes #13964, closes #13893, closes #13881, closes #13793, closes #13751, closes #13715\n'
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
