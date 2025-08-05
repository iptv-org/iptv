import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import { EOL } from 'node:os'
import * as fs from 'fs-extra'
import * as glob from 'glob'

const ENV_VAR = 'cross-env STREAMS_DIR=tests/__data__/input/playlist_generate DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output/.gh-pages LOGS_DIR=tests/__data__/output/logs'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('playlist:generate', () => {
  it('can generate playlists and logs', () => {
    const cmd = `${ENV_VAR} npm run playlist:generate`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const playlists = glob
      .sync('tests/__data__/expected/playlist_generate/.gh-pages/**/*.m3u')
      .map(filepath => {
        const fileUrl = pathToFileURL(filepath).toString()
        const pathToRemove = pathToFileURL('tests/__data__/expected/playlist_generate/').toString()

        return fileUrl.replace(pathToRemove, '')
      })

    playlists.forEach((filepath: string) => {
      expect(content(`tests/__data__/output/${filepath}`)).toBe(
        content(`tests/__data__/expected/playlist_generate/${filepath}`)
      )
    })

    expect(content('tests/__data__/output/logs/generators.log').split(EOL).sort()).toStrictEqual(
      content('tests/__data__/expected/playlist_generate/logs/generators.log').split(EOL).sort()
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
