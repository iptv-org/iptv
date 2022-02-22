const { execSync } = require('child_process')

it('show an error if channel name in the blocklist', () => {
  try {
    const stdout = execSync(
      'DATA_DIR=tests/__data__/input/data npm run playlist:validate -- tests/__data__/input/streams/us_blocked.m3u',
      {
        encoding: 'utf8'
      }
    )
    console.log(stdout)
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `\n> playlist:validate\n> node scripts/commands/playlist/validate.js "tests/__data__/input/streams/us_blocked.m3u"\n\nloading blocklist...\nfound 4 records\n\ntests/__data__/input/streams/us_blocked.m3u\n 2     error    "Fox Sports 2 Asia" is on the blocklist due to claims of copyright holders (https://github.com/iptv-org/iptv/issues/0000)\n\n1 problems (1 errors, 0 warnings)\n`
    )
  }
})

it('show a warning if channel has wrong id', () => {
  const stdout = execSync(
    'DATA_DIR=tests/__data__/input/data npm run playlist:validate -- tests/__data__/input/streams/wrong_id.m3u',
    {
      encoding: 'utf8'
    }
  )

  expect(stdout).toBe(
    `\n> playlist:validate\n> node scripts/commands/playlist/validate.js "tests/__data__/input/streams/wrong_id.m3u"\n\nloading blocklist...\nfound 4 records\n\ntests/__data__/input/streams/wrong_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n`
  )
})
