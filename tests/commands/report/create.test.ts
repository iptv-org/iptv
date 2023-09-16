import { execSync } from 'child_process'

it('can create report', () => {
  const stdout = execSync('DATA_DIR=tests/__data__/input/data npm run report:create', {
    encoding: 'utf8'
  })

  expect(
    stdout.includes(`
┌─────────┬─────────────┬───────────────────┬──────────────┐
│ (index) │ issueNumber │     channelId     │    status    │
├─────────┼─────────────┼───────────────────┼──────────────┤
│    0    │    14179    │ 'ManoramaNews.in' │  'pending'   │
│    1    │    14178    │     'TV3.my'      │  'blocked'   │
│    2    │    14177    │     'TUTV.us'     │ 'fullfilled' │
│    3    │    14176    │ 'ManoramaNews.in' │ 'duplicate'  │
│    4    │    14175    │     'TFX.fr'      │ 'invalid_id' │
└─────────┴─────────────┴───────────────────┴──────────────┘`)
  ).toBe(true)
})
