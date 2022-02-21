const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

it('can validate channels name', () => {
  try {
    execSync('node scripts/commands/validate.js --input-dir=tests/__data__/input/channels', {
      encoding: 'utf8'
    })
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `tests/__data__/input/channels/us_blocked.m3u:2   'Fox Sports' is on the blocklist due to claims of copyright holders (https://github.com/github/dmca/blob/master/2020/09/2020-09-16-dfl.md)\n\n`
    )
  }
})
