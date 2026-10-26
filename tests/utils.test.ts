import { describe, it, expect } from 'vitest'
import { parseStreamInfo } from '../scripts/utils'

const url = 'https://example.com/live/playlist.m3u8'

describe('parseStreamInfo', () => {
  it('reads the resolution of a master playlist without FRAME-RATE', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=2128000,CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=1280x720',
      'chunklist_720p.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=1064000,CODECS="avc1.4d401e,mp4a.40.2",RESOLUTION=854x480',
      'chunklist_480p.m3u8'
    ].join('\n')

    expect(parseStreamInfo(url, playlist)).toEqual({
      resolution: { width: 1280, height: 720 },
      bandwidth: 2128000,
      frameRate: undefined,
      codecs: 'avc1.4d401f,mp4a.40.2'
    })
  })

  it('reads the resolution of a master playlist without CODECS', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1024x576,FRAME-RATE=25.000',
      'tracks-v1/mono.m3u8'
    ].join('\n')

    expect(parseStreamInfo(url, playlist)?.resolution).toEqual({ width: 1024, height: 576 })
  })

  it('returns nothing for a media playlist or a master playlist without RESOLUTION', () => {
    const media = ['#EXTM3U', '#EXT-X-TARGETDURATION:6', '#EXTINF:6.0,', 'segment_1.ts'].join('\n')
    const audioOnly = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2"',
      'audio.m3u8'
    ].join('\n')

    expect(parseStreamInfo(url, media)).toBeUndefined()
    expect(parseStreamInfo(url, audioOnly)).toBeUndefined()
  })
})
