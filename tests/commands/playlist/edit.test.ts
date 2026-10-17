import { describe, beforeEach, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs-extra'

type ExecError = {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/data'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/playlist_edit/playlist.m3u',
    'tests/__data__/output/playlist.m3u'
  )
})

describe('playlist:edit', () => {
  it('shows list of options for a streams', () => {
    const cmd = `${ENV_VAR} npm run playlist:edit --- tests/__data__/output/playlist.m3u`
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

  it('keeps the stream titles when saving the playlist', () => {
    const cmd = `${ENV_VAR} npm run playlist:edit --- tests/__data__/output/playlist.m3u`
    try {
      execSync(cmd, { encoding: 'utf8' })
    } catch {
      // NOTE: for Windows only
    }

    const content = fs.readFileSync('tests/__data__/output/playlist.m3u', 'utf8')
    expect(content).toContain('tvg-id="HewadTV.af",Hewad TV (720p) [Not 24/7]')
    expect(content).toContain('tvg-id="",Télévision française 1 (480p)')
  })
})

function checkStdout(stdout: string) {
  expect(stdout).toContain('TF1.fr (TF1, Télévision française 1)')
  expect(stdout).toContain('Type...')
  expect(stdout).toContain('Skip')
}
