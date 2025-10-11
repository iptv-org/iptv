import axios, { AxiosInstance, AxiosProxyConfig, AxiosRequestConfig, AxiosResponse } from 'axios'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { ProxyParser } from './proxyParser.js'
import mediaInfoFactory from 'mediainfo.js'
import { OptionValues } from 'commander'
import { TESTING } from '../constants'
import { Stream } from '../models'

export type StreamTesterResult = {
  status: {
    ok: boolean
    code: string
  }
}

export type StreamTesterError = {
  name: string
  code?: string
  cause?: Error & { code?: string }
  response?: AxiosResponse
}

export type StreamTesterProps = {
  options: OptionValues
}

export class StreamTester {
  client: AxiosInstance
  options: OptionValues

  constructor({ options }: StreamTesterProps) {
    const proxyParser = new ProxyParser()
    let request: AxiosRequestConfig = {
      responseType: 'arraybuffer'
    }

    if (options.proxy !== undefined) {
      const proxy = proxyParser.parse(options.proxy) as AxiosProxyConfig

      if (
        proxy.protocol &&
        ['socks', 'socks5', 'socks5h', 'socks4', 'socks4a'].includes(String(proxy.protocol))
      ) {
        const socksProxyAgent = new SocksProxyAgent(options.proxy)

        request = { ...request, ...{ httpAgent: socksProxyAgent, httpsAgent: socksProxyAgent } }
      } else {
        request = { ...request, ...{ proxy } }
      }
    }

    this.client = axios.create(request)
    this.options = options
  }

  async test(stream: Stream): Promise<StreamTesterResult> {
    if (TESTING) {
      const results = (await import('../../tests/__data__/input/playlist_test/results.js')).default

      return results[stream.url as keyof typeof results]
    } else {
      try {
        const res = await this.client(stream.url, {
          signal: AbortSignal.timeout(this.options.timeout),
          headers: {
            'User-Agent': stream.user_agent || 'Mozilla/5.0',
            Referer: stream.referrer
          }
        })

        const mediainfo = await mediaInfoFactory({ format: 'object' })
        const buffer = await res.data
        const result = await mediainfo.analyzeData(
          () => buffer.byteLength,
          (size: number, offset: number) => Buffer.from(buffer).subarray(offset, offset + size)
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
      } catch (err: unknown) {
        const error = err as StreamTesterError

        let code = 'UNKNOWN_ERROR'
        if (error.name === 'CanceledError') {
          code = 'TIMEOUT'
        } else if (error.name === 'AxiosError') {
          if (error.response) {
            const status = error.response?.status
            const statusText = error.response?.statusText.toUpperCase().replace(/\s+/, '_')
            code = `HTTP_${status}_${statusText}`
          } else {
            code = `AXIOS_${error.code}`
          }
        } else if (error.cause) {
          const cause = error.cause
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
