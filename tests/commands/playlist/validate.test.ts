import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data ROOT_DIR=tests/__data__/input/playlist_validate'

describe('playlist:validate', () => {
  it('show an error if channel id in the blocklist', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- us_blocked.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(0)
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

  it('show a warning if stream is missing a channel id', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- missing_channel_id.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      expect(stdout).toContain(
        'missing_channel_id.m3u\n 2     warning  "https://example.com/playlist2.m3u8" is missing a channel ID\n\n1 problems (0 errors, 1 warnings)\n'
      )
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
    }
  })

  it('show a warning if stream has wrong channel id', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- wrong_channel_id.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      expect(stdout).toContain(
        'wrong_channel_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n'
      )
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
    }
  })

  it('show a warning if stream is missing a feed id', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- missing_feed_id.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      expect(stdout).toContain(
        'missing_feed_id.m3u\n 2     warning  "https://example.com/playlist2.m3u8" is missing a feed ID\n\n1 problems (0 errors, 1 warnings)\n'
      )
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
    }
  })

  it('show a warning if stream has a wrong feed id', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- wrong_feed_id.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      expect(stdout).toContain(
        'wrong_feed_id.m3u\n 2     warning  There is no feed with the ID "HD" in the database for the "Channel7.bz" channel\n\n1 problems (0 errors, 1 warnings)\n'
      )
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
    }
  })

  it('show a error if stream has an invalid url', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- invalid_url.m3u`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(0)
    } catch (error) {
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      expect((error as ExecError).stdout).toContain('invalid_url.m3u')
      expect((error as ExecError).stdout).toContain(
        '2     error    "new: https://streamer2.nexgen.bz/07-CHANNEL7/index.m3u8" is not a valid URL'
      )
      expect((error as ExecError).stdout).toContain('1 problems (1 errors, 0 warnings)')
    }
  })

  it('skip the file if it does not exist', () => {
    const cmd = `${ENV_VAR} npm run playlist:validate -- missing.m3u`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)
  })
})
