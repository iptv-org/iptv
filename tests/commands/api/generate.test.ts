import { execSync } from 'child_process'
import fs from 'fs-extra'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

it('can create streams.json', () => {
  execSync(
    'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/api_generate API_DIR=tests/__data__/output/.api npm run api:generate',
    { encoding: 'utf8' }
  )

  expect(content('output/.api/streams.json')).toMatchObject(
    content('expected/api_generate/.api/streams.json')
  )
})

function content(filepath: string) {
  return JSON.parse(
    fs.readFileSync(`tests/__data__/${filepath}`, {
      encoding: 'utf8'
    })
  )
}
