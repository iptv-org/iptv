import { execSync } from 'child_process'
import os from 'os'

type ExecError = {
  status: number
  stdout: string
}

let ENV_VAR = 'ROOT_DIR=tests/__data__/input'
if (os.platform() === 'win32') {
  ENV_VAR = 'SET "ROOT_DIR=tests/__data__/input" &&'
}

describe('playlist:test', () => {
  it('shows an error if the playlist contains a broken link', () => {
    const cmd = `${ENV_VAR} npm run playlist:test playlist_test/ag.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      checkStdout(stdout)
    } catch (error) {
      // NOTE: for Windows only
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      checkStdout((error as ExecError).stdout)
    }
  })
})

function checkStdout(stdout: string) {
  expect(stdout).toContain('playlist_test/ag.m3u')
  expect(stdout).toContain('2 problems (1 errors, 1 warnings)')
}
