import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/streams_format', 'tests/__data__/output/streams')
})

it('can format playlists', () => {
  execSync('STREAMS_DIR=tests/__data__/output/streams npm run playlist:format', {
    encoding: 'utf8'
  })

  const files = glob
    .sync('tests/__data__/expected/streams_format/*.m3u')
    .map(f => f.replace('tests/__data__/expected/streams_format/', ''))

  files.forEach(filepath => {
    expect(content(`output/streams/${filepath}`), filepath).toBe(
      content(`expected/streams_format/${filepath}`)
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
