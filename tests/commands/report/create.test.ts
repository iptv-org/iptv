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
┌─────────┬─────────────┬──────────────────┬────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────┬───────────────┐
│ (index) │ issueNumber │ type             │ channelId                  │ streamUrl                                                                                              │ status        │
├─────────┼─────────────┼──────────────────┼────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────┼───────────────┤
│ 0       │ 14120       │ 'streams:edit'   │ 'boo.us'                   │ 'https://livestream.telvue.com/templeuni1/f7b44cfafd5c52223d5498196c8a2e7b.sdp/playlist.m3u8'          │ 'invalid_id'  │
│ 1       │ 14135       │ 'streams:add'    │ 'BBCWorldNewsSouthAsia.uk' │ 'http://103.199.161.254/Content/bbcworld/Live/Channel%28BBCworld%29/Stream%2801%29/index.m3u8'         │ 'wrong_id'    │
│ 2       │ 14140       │ 'streams:add'    │ undefined                  │ undefined                                                                                              │ 'missing_id'  │
│ 3       │ 14175       │ 'streams:add'    │ 'TFX.fr'                   │ 'http://livetv.ktv.zone/13/play.m3u8'                                                                  │ 'duplicate'   │
│ 4       │ 14177       │ 'streams:add'    │ 'TUTV.us'                  │ 'https://livestream.telvue.com/templeuni1/f7b44cfafd5c52223d5498196c8a2e7b.sdp/playlist.m3u8'          │ 'on_playlist' │
│ 5       │ 14178       │ 'streams:add'    │ 'TV3.my'                   │ 'https://live-streams-ssai-01.tonton.com.my/live/2dd2b7cd-1b34-4871-b669-57b5c9beca23/live.isml/.m3u8' │ 'blocked'     │
│ 6       │ 16120       │ 'broken stream'  │ undefined                  │ 'http://190.61.102.67:2000/play/a038/index.m3u8'                                                       │ 'wrong_link'  │
│ 7       │ 19956       │ 'channel search' │ 'CNBCe.tr'                 │ undefined                                                                                              │ 'invalid_id'  │
│ 8       │ 19957       │ 'channel search' │ '13thStreet.au'            │ undefined                                                                                              │ 'closed'      │
└─────────┴─────────────┴──────────────────┴────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────┴───────────────┘`)
  ).toBe(true)
})
