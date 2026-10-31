import { describe, it, expect } from 'vitest'
import { createServer } from 'node:http'
import { AddressInfo } from 'node:net'
import { ProxyParser } from '../scripts/core/proxyParser'
import { StreamTester } from '../scripts/core/streamTester'

describe('ProxyParser', () => {
  it('decodes URL-encoded credentials', () => {
    expect(new ProxyParser().parse('http://user%40example.com:p%3Ass%2Fword@localhost:8080')).toEqual({
      protocol: 'http',
      host: 'localhost',
      port: 8080,
      auth: { username: 'user@example.com', password: 'p:ss/word' }
    })
  })

  it('decodes credentials once and preserves literal plus signs', () => {
    const proxy = new ProxyParser().parse('http://user+name:p%252F%25+word@localhost:8080')

    expect(proxy.auth).toEqual({ username: 'user+name', password: 'p%2F%+word' })
  })

  it('preserves plain credentials', () => {
    expect(new ProxyParser().parse('http://user:password@localhost:8080').auth).toEqual({
      username: 'user',
      password: 'password'
    })
  })

  it('does not add authentication when credentials are absent', () => {
    expect(new ProxyParser().parse('http://localhost:8080')).toEqual({
      protocol: 'http',
      host: 'localhost',
      port: 8080
    })
  })

  it('authenticates stream requests through a proxy with escaped credentials', async () => {
    const authorization = `Basic ${Buffer.from('user@example.com:p:ss/word').toString('base64')}`
    let receivedAuthorization: string | undefined
    let receivedUrl: string | undefined
    const proxy = createServer((request, response) => {
      receivedAuthorization = request.headers['proxy-authorization']
      receivedUrl = request.url
      response.writeHead(receivedAuthorization === authorization ? 200 : 407)
      response.end('proxy response')
    })
    await new Promise<void>(resolve => proxy.listen(0, '127.0.0.1', resolve))

    try {
      const { port } = proxy.address() as AddressInfo
      const tester = new StreamTester({
        options: { proxy: `http://user%40example.com:p%3Ass%2Fword@127.0.0.1:${port}` }
      })
      const response = await tester.client('http://example.test/live/playlist.m3u8', {
        timeout: 2000
      })

      expect(response.status).toBe(200)
      expect(receivedAuthorization).toBe(authorization)
      expect(receivedUrl).toBe('http://example.test/live/playlist.m3u8')
    } finally {
      await new Promise<void>((resolve, reject) => {
        proxy.close(error => (error ? reject(error) : resolve()))
      })
    }
  })
})
