import { execSync } from 'child_process'
import * as fs from 'fs-extra'
import { glob } from 'glob'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/streams_update', 'tests/__data__/output/streams')
})

it('can format playlists', () => {
  const stdout = execSync(
    'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/output/streams npm run playlist:update --silent',
    {
      encoding: 'utf8'
    }
  )

  const files = glob
    .sync('tests/__data__/expected/streams_update/*.m3u')
    .map(f => f.replace('tests/__data__/expected/streams_update/', ''))

  files.forEach(filepath => {
    expect(content(`output/streams/${filepath}`), filepath).toBe(
      content(`expected/streams_update/${filepath}`)
    )
  })

  expect(stdout).toBe(
    'OUTPUT=closes #14151, closes #14140, closes #14139, closes #14110, closes #14178\n'
  )
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
