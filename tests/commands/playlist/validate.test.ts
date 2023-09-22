import { execSync } from 'child_process'

it('show an error if channel name in the blocklist', () => {
  try {
    const stdout = execSync(
      'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams_validate npm run playlist:validate -- us_blocked.m3u',
      {
        encoding: 'utf8'
      }
    )
    console.log(stdout)
    process.exit(1)
  } catch (error: unknown) {
    // @ts-ignore
    expect(error.status).toBe(1)
    expect(
      // @ts-ignore
      error.stdout.includes(
        'us_blocked.m3u\n 2     error    "Fox Sports 2 Asia (Thai)" is on the blocklist due to claims of copyright holders (https://github.com/iptv-org/iptv/issues/0000)\n\n1 problems (1 errors, 0 warnings)\n'
      )
    ).toBe(true)
  }
})

it('show a warning if channel has wrong id', () => {
  const stdout = execSync(
    'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams_validate npm run playlist:validate -- wrong_id.m3u',
    {
      encoding: 'utf8'
    }
  )

  expect(
    stdout.includes(
      'wrong_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n'
    )
  ).toBe(true)
})
