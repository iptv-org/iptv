import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env ROOT_DIR=tests/__data__/input DATA_DIR=tests/__data__/input/data'

describe('playlist:test', () => {
  it('shows an error if the playlist contains a broken link', () => {
    const cmd = `${ENV_VAR} npm run playlist:test playlist_test/ag.m3u`
    try {
      execSync(cmd, { encoding: 'utf8' })
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      expect((error as ExecError).stdout).toContain('playlist_test/ag.m3u')
      expect((error as ExecError).stdout).toContain('2 problems (1 errors, 1 warnings)')
    }
  })
})
