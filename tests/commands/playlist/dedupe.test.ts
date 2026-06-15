import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'

const ENV_VAR =
  'cross-env STREAMS_DIR=tests/__data__/output/streams DATA_DIR=tests/__data__/input/data'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_dedupe', 'tests/__data__/output/streams')
})

describe('playlist:dedupe', () => {
  it('keeps the best stream per channel and writes best.m3u', () => {
    const cmd = `${ENV_VAR} npm run --silent playlist:dedupe`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/streams/best.m3u')).toBe(
      content('tests/__data__/expected/playlist_dedupe/best.m3u')
    )
  })

  it('does not write output when --dry-run is set', () => {
    const cmd = `${ENV_VAR} npm run --silent playlist:dedupe -- --dry-run`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(fs.existsSync('tests/__data__/output/streams/best.m3u')).toBe(false)
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
