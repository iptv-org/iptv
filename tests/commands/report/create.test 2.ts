import { execSync } from 'child_process'

it('can create report', () => {
  const stdout = execSync(
    'DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/input/streams_report npm run report:create',
    {
      encoding: 'utf8'
    }
  )

  expect(
    stdout.includes(`
┌─────────┬─────────────┬─────────────────┬─────────────────────┬────────────────┐
│ (index) │ issueNumber │ type            │ channelId           │ status         │
├─────────┼─────────────┼─────────────────┼─────────────────────┼────────────────┤
│ 0       │ 14110       │ 'streams:edit'  │ 'BBCAmericaEast.us' │ 'invalid_link' │
│ 1       │ 14120       │ 'streams:edit'  │ 'boo.us'            │ 'invalid_id'   │
│ 2       │ 14140       │ 'broken stream' │ undefined           │ 'invalid_link' │
│ 3       │ 14175       │ 'streams:add'   │ 'TFX.fr'            │ 'invalid_id'   │
│ 4       │ 14176       │ 'streams:add'   │ 'ManoramaNews.in'   │ 'duplicate'    │
│ 5       │ 14177       │ 'streams:add'   │ 'TUTV.us'           │ 'fullfilled'   │
│ 6       │ 14178       │ 'streams:add'   │ 'TV3.my'            │ 'blocked'      │
│ 7       │ 14179       │ 'streams:add'   │ 'ManoramaNews.in'   │ 'pending'      │
└─────────┴─────────────┴─────────────────┴─────────────────────┴────────────────┘`)
  ).toBe(true)
})
