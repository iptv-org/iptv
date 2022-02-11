const { execSync } = require('child_process')

it('show error if channel name in the blocklist', () => {
  try {
    execSync('node scripts/commands/validate.js tests/__data__/input/channels/us_blocked.m3u', {
      encoding: 'utf8'
    })
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `\ntests/__data__/input/channels/us_blocked.m3u\n 2     error    "Fox Sports" is on the blocklist due to claims of copyright holders (https://github.com/github/dmca/blob/master/2020/09/2020-09-16-dfl.md)\n\n1 problems (1 errors, 0 warnings)\n`
    )
  }
})

it('show warning if channel has wrong id', () => {
  const stdout = execSync(
    'node scripts/commands/validate.js tests/__data__/input/channels/wrong_id.m3u',
    {
      encoding: 'utf8'
    }
  )

  expect(stdout).toBe(
    `\ntests/__data__/input/channels/wrong_id.m3u\n 2     warning  "qib22lAq1L.us" is not in the database\n\n1 problems (0 errors, 1 warnings)\n`
  )
})
