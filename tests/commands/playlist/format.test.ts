import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

const ENV_VAR =
  'cross-env STREAMS_DIR=tests/__data__/output/streams DATA_DIR=tests/__data__/input/data'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_format', 'tests/__data__/output/streams')
})

describe('playlist:format', () => {
  it('can format playlists', () => {
    const cmd = `${ENV_VAR} npm run playlist:format`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob.sync('tests/__data__/expected/playlist_format/*.m3u').map(filepath => {
      const fileUrl = pathToFileURL(filepath).toString()
      const pathToRemove = pathToFileURL('tests/__data__/expected/playlist_format/').toString()

      return fileUrl.replace(pathToRemove, '')
    })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/streams/${filepath}`)).toBe(
        content(`tests/__data__/expected/playlist_format/${filepath}`)
      )
    })
  })

  it('formats playlists in nested directories', () => {
    const cmd = `${ENV_VAR} npm run playlist:format`
    execSync(cmd, { encoding: 'utf8' })

    const output = content('tests/__data__/output/streams/nested/nested.m3u')
    expect(output).toContain(',Alpha (720p)')
    expect(output).toContain(',Zulu (720p)')
    expect(output.indexOf(',Alpha (720p)')).toBeLessThan(output.indexOf(',Zulu (720p)'))
  })

  it('keeps links with malformed percent escapes', () => {
    fs.emptyDirSync('tests/__data__/output')
    fs.copySync('tests/__data__/input/playlist_normalize', 'tests/__data__/output/streams')

    const cmd =
      'cross-env STREAMS_DIR=tests/__data__/output/streams DATA_DIR=tests/__data__/input/data npm run playlist:format'
    execSync(cmd, { encoding: 'utf8' })

    expect(content('tests/__data__/output/streams/bad_encoding.m3u')).toContain(
      'http://example.com/a%ZZ'
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
