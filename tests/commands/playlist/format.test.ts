import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'
import os from 'os'

let ENV_VAR = 'STREAMS_DIR=tests/__data__/output/streams'
if (os.platform() === 'win32') {
  ENV_VAR = 'SET "STREAMS_DIR=tests/__data__/output/streams" &&'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_format', 'tests/__data__/output/streams')
})

describe('playlist:format', () => {
  it('can format playlists', () => {
    const cmd = `${ENV_VAR} npm run playlist:format`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob.sync('tests/__data__/expected/playlist_format/*.m3u').map(filepath => {
      const fileUrl = pathToFileURL(filepath).toString()
      const pathToRemove = pathToFileURL('tests/__data__/expected/playlist_format/').toString()

      return fileUrl.replace(pathToRemove, '')
    })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/streams/${filepath}`), filepath).toBe(
        content(`tests/__data__/expected/playlist_format/${filepath}`)
      )
    })
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
