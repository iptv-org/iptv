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
    'OUTPUT=closes #14151, closes #14140, closes #14110, closes #14120, closes #14175, closes #14174, closes #14173, closes #14172, closes #14171, closes #14170, closes #14169, closes #14164, closes #14162, closes #14160, closes #14159, closes #14158, closes #14155, closes #14153, closes #14152, closes #14105, closes #14104, closes #14057, closes #14034, closes #13964, closes #13893, closes #13881, closes #13793, closes #13751, closes #13715\n'
  )
})

function content(filepath: string) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
