import { Stream } from '../models'
import { TESTING } from '../constants'
import MediainfoFactory from 'mediainfo.js'

export class StreamTester {
  constructor() {}

  async test(stream: Stream) {
    if (TESTING) {
      const results = (await import('../../tests/__data__/input/playlist_test/results.js')).default

      return results[stream.url as keyof typeof results]
    } else {
      try {
        const controller = new AbortController()
        const timeout = 10000
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const res = await fetch(stream.url, {
          signal: controller.signal,
          headers: {
            'User-Agent': stream.getUserAgent() || 'Mozilla/5.0',
            Referer: stream.getReferrer()
          }
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          return {
            status: {
              ok: false,
              code: `HTTP_${res.status}`
            }
          }
        }

        const mediainfo = await MediainfoFactory({ format: 'object' })
        const buffer = await res.arrayBuffer()
        const result = await mediainfo.analyzeData(
          () => buffer.byteLength,
          (size: any, offset: number | undefined) =>
            Buffer.from(buffer).subarray(offset, offset + size)
        )

        if (result && result.media && result.media.track.length > 0) {
          return {
            status: {
              ok: true,
              code: 'OK'
            }
          }
        } else {
          return {
            status: {
              ok: false,
              code: 'NO_VIDEO'
            }
          }
        }
      } catch (error: any) {
        let code = 'UNKNOWN_ERROR'
        if (error.name === 'AbortError') {
          code = 'TIMEOUT'
        } else if (error.cause) {
          const cause = error.cause as Error & { code?: string }
          if (cause.code) {
            code = cause.code
          } else {
            code = cause.name
          }
        }

        return {
          status: {
            ok: false,
            code
          }
        }
      }
    }
  }
}
