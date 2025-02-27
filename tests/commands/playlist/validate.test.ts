import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

it('show an error if channel id in the blocklist', () => {
  try {
    execSync(
      'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams_validate npm run playlist:validate -- us_blocked.m3u',
      {
        encoding: 'utf8'
      }
    )
    process.exit(1)
  } catch (error) {
    expect((error as ExecError).status).toBe(1)
    expect((error as ExecError).stdout).toContain(`us_blocked.m3u
 2     error    "FoxSports2Asia.us" is on the blocklist due to claims of copyright holders (https://github.com/iptv-org/iptv/issues/0002)
 4     error    "TVN.pl" is on the blocklist due to NSFW content (https://github.com/iptv-org/iptv/issues/0003)

2 problems (2 errors, 0 warnings)`)
  }
})

it('show a warning if channel has wrong id', () => {
  const stdout = execSync(
    'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams_validate npm run playlist:validate -- wrong_id.m3u',
    {
      encoding: 'utf8'
    }
  )

  expect(stdout).toContain(
    'wrong_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n'
  )
})
