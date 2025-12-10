import child_process from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import * as fs from 'fs-extra'
import { glob } from 'glob'

const exec = promisify(child_process.exec)

type ExecError = {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/data ROOT_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_test/streams', 'tests/__data__/output/streams')
})

describe('playlist:test', () => {
  it('shows an error if the playlist contains a broken link', async () => {
    const cmd = `${ENV_VAR} npm run playlist:test streams/ag.m3u`

    try {
      await exec(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      expect((error as ExecError).stdout).toContain('streams/ag.m3u')
      expect((error as ExecError).stdout).toContain('2 problems (1 errors, 1 warnings)')
    }
  })

  it('it can remove all broken links from the playlist', async () => {
    const cmd = `${ENV_VAR} npm run playlist:test streams/ag.m3u --- --fix`
    try {
      await exec(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      const files = glob.sync('tests/__data__/expected/playlist_test/*.m3u').map(filepath => {
        const fileUrl = pathToFileURL(filepath).toString()
        const pathToRemove = pathToFileURL('tests/__data__/expected/playlist_test/').toString()

        return fileUrl.replace(pathToRemove, '')
      })

      files.forEach(filepath => {
        expect(content(`tests/__data__/output/streams/${filepath}`)).toBe(
          content(`tests/__data__/expected/playlist_test/${filepath}`)
        )
      })
    }
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
