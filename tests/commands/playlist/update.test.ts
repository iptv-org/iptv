import { describe, beforeEach, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/output/streams LOGS_DIR=tests/__data__/output/logs'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_update/streams', 'tests/__data__/output/streams')
})

describe('playlist:update', () => {
  it('can update playlists', async () => {
    let cmd = `${ENV_VAR} npm run playlist:update`
    if (!process.env.DEBUG) cmd += ' --silent'
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)

      const files = glob
        .sync('tests/__data__/expected/playlist_update/streams/*.m3u')
        .map(filepath => {
          const fileUrl = pathToFileURL(filepath).toString()
          const pathToRemove = pathToFileURL(
            'tests/__data__/expected/playlist_update/streams/'
          ).toString()

          return fileUrl.replace(pathToRemove, '')
        })

      files.forEach(filepath => {
        expect(content(`tests/__data__/output/streams/${filepath}`)).toBe(
          content(`tests/__data__/expected/playlist_update/streams/${filepath}`)
        )
      })

      expect(content('tests/__data__/output/logs/playlist_update.log')).toBe(
        content('tests/__data__/expected/playlist_update/playlist_update.log')
      )
    } catch (err) {
      if (process.env.DEBUG === 'true') console.log(cmd, err.stdout)
    }
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
