import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/data ROOT_DIR=tests/__data__/input/playlist_validate'

describe('playlist:validate', () => {
  it('show an error if channel id in the blocklist', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- us_blocked.m3u`
    try {
      execSync(cmd, { encoding: 'utf8' })
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      expect((error as ExecError).stdout).toContain('us_blocked.m3u')
      expect((error as ExecError).stdout).toContain(
        '2     error    "FoxSports2.us" is on the blocklist due to claims of copyright holders (https://github.com/iptv-org/iptv/issues/0002)'
      )
      expect((error as ExecError).stdout).toContain(
        '4     error    "TVN.pl" is on the blocklist due to NSFW content (https://github.com/iptv-org/iptv/issues/0003)'
      )
      expect((error as ExecError).stdout).toContain('2 problems (2 errors, 0 warnings)')
    }
  })

  it('show a warning if channel has wrong id', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- wrong_id.m3u`
    try {
      execSync(cmd, { encoding: 'utf8' })
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      expect((error as ExecError).stdout).toContain(
        'wrong_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n'
      )
    }
  })

  it('skip the file if it does not exist', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- missing.m3u`
    execSync(cmd, { encoding: 'utf8' })
  })
})
