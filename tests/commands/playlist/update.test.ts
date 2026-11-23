import { describe, beforeEach, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/output/streams LOGS_DIR=tests/__data__/output/logs'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/playlist_update/streams', 'tests/__data__/output/streams')
})

describe('playlist:update', () => {
  it('sorts edited and removed playlists without losing entries or playback options', () => {
    const entries = [
      '#EXTINF:-1 tvg-id="",Zulu (720p)',
      'https://example.com/zulu.m3u8',
      '#EXTINF:-1 tvg-id="",Alpha (720p)',
      '#EXTVLCOPT:http-referrer=https://example.com/',
      'https://example.com/alpha.m3u8',
      ''
    ].join('\r\n')
    for (const country of ['cy', 'br_example']) {
      fs.appendFileSync(`tests/__data__/output/streams/${country}.m3u`, entries)
    }

    execSync(`${ENV_VAR} npm run playlist:update --silent`, { encoding: 'utf8' })
    for (const country of ['cy', 'br_example']) {
      const output = content(`tests/__data__/output/streams/${country}.m3u`)
      expect(output.indexOf(',Alpha (720p)')).toBeLessThan(output.indexOf(',Zulu (720p)'))
      expect(output).toContain('#EXTVLCOPT:http-referrer=https://example.com/')
      expect(output).toContain('https://example.com/alpha.m3u8')
      expect(output).toContain('https://example.com/zulu.m3u8')
    }
    expect(content('tests/__data__/output/streams/cy.m3u')).toContain(',AdaTV')
    expect(content('tests/__data__/output/streams/br_example.m3u')).toContain(',BBC America')
  })

  it('leaves the order of unrelated playlists unchanged', () => {
    const filepath = 'tests/__data__/output/streams/zz.m3u'
    const original = [
      '#EXTM3U',
      '#EXTINF:-1 tvg-id="",Zulu (720p)',
      'https://example.com/zulu.m3u8',
      '#EXTINF:-1 tvg-id="",Alpha (720p)',
      'https://example.com/alpha.m3u8',
      ''
    ].join('\r\n')
    fs.writeFileSync(filepath, original)
    execSync(`${ENV_VAR} npm run playlist:update --silent`, { encoding: 'utf8' })
    expect(content(filepath)).toBe(original)
  })

  it('keeps the main feed in the stream ID when an edit gives only the channel ID', () => {
    execSync(`${ENV_VAR} npm run playlist:update --silent`, { encoding: 'utf8' })

    expect(content('tests/__data__/output/streams/uk.m3u')).toContain(
      '#EXTINF:-1 tvg-id="BBCNews.uk@SD",BBC News (720p) [Not 24/7]'
    )
  })

  it('can update playlists', async () => {
    let cmd = `${ENV_VAR} npm run playlist:update`
    if (!process.env.DEBUG) cmd += ' --silent'
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const files = glob
      .sync('tests/__data__/expected/playlist_update/streams/*.m3u')
      .map(filepath => {
        const fileUrl = pathToFileURL(filepath).toString()
        const pathToRemove = pathToFileURL(
          'tests/__data__/expected/playlist_update/streams/'
        ).toString()

        return fileUrl.replace(pathToRemove, '')
      })

    files.forEach(filepath => {
      expect(content(`tests/__data__/output/streams/${filepath}`)).toBe(
        content(`tests/__data__/expected/playlist_update/streams/${filepath}`)
      )
    })

    const uk = content('tests/__data__/output/streams/uk.m3u')
    expect(uk.indexOf(',BBC News')).toBeLessThan(uk.indexOf(',Beano TV'))
    expect(uk.indexOf(',Beano TV')).toBeLessThan(uk.indexOf(',Fox Sports'))
    expect(uk).toContain('|Referer="https://referer.xyz/"|User-Agent=')

    expect(content('tests/__data__/output/logs/playlist_update.log')).toBe(
      content('tests/__data__/expected/playlist_update/playlist_update.log')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
