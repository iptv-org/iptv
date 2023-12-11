import { execSync } from 'child_process'
import fs from 'fs-extra'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  execSync(
    'STREAMS_DIR=tests/__data__/input/streams_generate API_DIR=tests/__data__/output/.api npm run api:generate',
    { encoding: 'utf8' }
  )
})

it('can create streams.json', () => {
  expect(content('output/.api/streams.json')).toMatchObject(content('expected/.api/streams.json'))
})

function content(filepath: string) {
  return JSON.parse(
    fs.readFileSync(`tests/__data__/${filepath}`, {
      encoding: 'utf8'
    })
  )
}
