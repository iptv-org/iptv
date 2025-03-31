import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

it('shows an error if the playlist contains a broken link', () => {
  try {
    execSync('ROOT_DIR=tests/__data__/input npm run playlist:test playlist_test/ag.m3u', {
      encoding: 'utf8'
    })
    process.exit(1)
  } catch (error) {
    expect((error as ExecError).status).toBe(1)
    expect((error as ExecError).stdout).toContain('playlist_test/ag.m3u')
    expect((error as ExecError).stdout).toContain('2 problems (1 errors, 1 warnings)')
  }
})
