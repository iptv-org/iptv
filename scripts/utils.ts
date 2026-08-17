import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import axios, { AxiosProxyConfig, AxiosRequestConfig } from 'axios'
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql'
import { parse as parsePlaylist, setOptions } from 'hls-parser'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { Collection, Dictionary } from '@freearhey/core'
import { SocksProxyAgent } from 'socks-proxy-agent'
import { parse as parseManifest } from 'mpd-parser'
import { TESTING, OWNER, REPO } from './constants'
import { ProxyParser, DataSet } from './core'
import { Discussion, Issue } from './models'
import normalizeUrl from 'normalize-url'
import { Octokit } from '@octokit/core'
import { orderBy } from 'es-toolkit'
import path from 'node:path'
import fs from 'node:fs'

export function hasValidDomain(string: string): boolean {
  const FORBIDDEN_DOMAINS = ['iptv-org.github.io']
  try {
    const parsedUrl = new URL(string)
    const hostname = parsedUrl.hostname
    const isForbidden = FORBIDDEN_DOMAINS.some(
      domain => hostname === domain || hostname.endsWith(`.${domain}`)
    )
    return !isForbidden
  } catch {
    return false
  }
}

export function isURI(string: string): boolean {
  try {
    const url = new URL(string)
    return /^(http:|https:|mms:|mmsh:|rtsp:|rtmp:|srt:|rtp:|udp:)/.test(url.protocol)
  } catch {
    return false
  }
}

export function normalizeURL(url: string): string {
  const normalized = normalizeUrl(url, { stripWWW: false })

  return decodeURIComponent(normalized).replace(/\s/g, '+').toString()
}

export function truncate(string: string, limit: number = 100) {
  if (!string) return string
  if (string.length < limit) return string

  return string.slice(0, limit - 3) + '...'
}

type StreamInfo = {
  resolution: { width: number; height: number }
  bandwidth: number
  frameRate: number
  codecs: string
}

export async function getStreamInfo(
  url: string,
  options: {
    httpUserAgent?: string | null
    httpReferrer?: string | null
    timeout?: number
    proxy?: string
  }
): Promise<StreamInfo | undefined> {
  let data: string | undefined
  if (TESTING) {
    if (url.includes('.m3u8')) {
      data = fs.readFileSync(
        path.resolve(__dirname, '../tests/__data__/input/playlist_update/playlist.m3u8'),
        'utf8'
      )
    } else if (url.includes('.mpd')) {
      data = fs.readFileSync(
        path.resolve(__dirname, '../tests/__data__/input/playlist_update/manifest.mpd'),
        'utf8'
      )
    }
  } else {
    try {
      const timeout = options.timeout || 1000
      let request: AxiosRequestConfig = {
        signal: AbortSignal.timeout(timeout),
        responseType: 'text',
        headers: {
          'User-Agent': options.httpUserAgent || 'Mozilla/5.0',
          Referer: options.httpReferrer
        }
      }

      if (options.proxy !== undefined) {
        const proxyParser = new ProxyParser()
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

      const response = await axios(url, request)

      data = response.data
    } catch {
      // do nothing
    }
  }

  if (!data) return undefined

  let info: StreamInfo | undefined

  if (url.includes('.m3u8')) {
    setOptions({ silent: true })

    try {
      const playlist = parsePlaylist(data)

      if (playlist && playlist.isMasterPlaylist && playlist.variants.length) {
        const v = orderBy(playlist.variants, ['bandwidth'], ['desc'])[0]

        if (v && v.resolution && v.frameRate && v.codecs) {
          info = {
            resolution: { width: v.resolution.width, height: v.resolution.height },
            bandwidth: v.bandwidth,
            frameRate: v.frameRate,
            codecs: v.codecs
          }
        }
      }
    } catch {
      // do nothing
    }
  } else if (url.includes('.mpd')) {
    const manifest = parseManifest(data, {
      manifestUri: url,
      eventHandler: ({ type, message }) => console.log(`${type}: ${message}`)
    })

    const playlist = orderBy(manifest.playlists, [p => p.attributes.BANDWIDTH], ['desc'])[0]

    if (playlist) {
      const attr = playlist.attributes

      info = {
        resolution: { width: attr.RESOLUTION.width, height: attr.RESOLUTION.height },
        bandwidth: attr.BANDWIDTH,
        frameRate: attr['FRAME-RATE'],
        codecs: attr.CODECS
      }
    }
  }

  return info
}

export async function loadIssues(props?: { labels: string | string[] }) {
  const CustomOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
  const octokit = new CustomOctokit()

  let labels = ''
  if (props && props.labels) {
    labels = Array.isArray(props.labels) ? props.labels.join(',') : props.labels
  }
  let issues: object[] = []
  if (TESTING) {
    issues = (await import('../tests/__data__/input/issues.js')).default
  } else {
    issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
      owner: OWNER,
      repo: REPO,
      per_page: 100,
      labels,
      status: 'open',
      direction: 'asc',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
  }

  return new Collection(issues).map(({ number, body, labels }) => {
    const dataSet = parseIssueBody(body)
    return new Issue({ number, labels: labels.map(l => l.name), dataSet })
  })
}

export function parseIssueBody(body: string): DataSet {
  const FIELDS = new Dictionary({
    'Stream ID': 'stream_id',
    'Channel ID': 'channel_id',
    'Feed ID': 'feed_id',
    'Stream URL': 'stream_url',
    Label: 'label',
    Quality: 'quality',
    'HTTP User-Agent': 'http_user_agent',
    'HTTP User Agent': 'http_user_agent',
    'HTTP Referrer': 'http_referrer',
    'What happened to the stream?': 'reason',
    Reason: 'reason',
    Notes: 'notes'
  })

  const fields = typeof body === 'string' ? body.split('###') : []

  const data = new Dictionary<string>()
  fields.forEach((field: string) => {
    const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
    let _label = parsed.shift()
    _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
    let _value = parsed.join('\r\n')
    _value = _value ? _value.trim() : ''

    if (!_label || !_value) return data

    const id = FIELDS.get(_label)
    const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

    if (!id) return

    data.set(id, value)
  })

  return new DataSet(data)
}

export async function loadDiscussions() {
  let discussions: object[] = []
  if (TESTING) {
    discussions = (await import('../tests/__data__/input/discussions.js')).default
  } else {
    const CustomOctokit = Octokit.plugin(paginateGraphQL)
    const octokit = new CustomOctokit({
      auth: process.env.GITHUB_TOKEN
    })

    const query = `
      query ($owner: String!, $repo: String!, $cursor: String, $orderBy: DiscussionOrder) {
        repository(owner: $owner, name: $repo) {
          discussions(first: 100, after: $cursor, states: OPEN, orderBy: $orderBy) {
            nodes {
              number
              body
              category {
                name
              }
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `

    const result = await octokit.graphql.paginate(query, {
      owner: 'iptv-org',
      repo: 'iptv',
      orderBy: {
        field: 'CREATED_AT',
        direction: 'ASC'
      }
    })

    discussions = result.repository.discussions.nodes
  }

  return new Collection(discussions).map(parseDiscussion)
}

function parseDiscussion(discussion: {
  number: number
  category: { name: string }
  body: string
}): Discussion {
  const FIELDS = new Dictionary({
    'Stream ID': 'stream_id'
  })

  const fields = typeof discussion.body === 'string' ? discussion.body.split('###') : []

  const data = new Dictionary<string>()
  fields.forEach((field: string) => {
    const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
    let _label = parsed.shift()
    _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
    let _value = parsed.join('\r\n')
    _value = _value ? _value.trim() : ''

    if (!_label || !_value) return data

    const id = FIELDS.get(_label)
    const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

    if (!id) return

    data.set(id, value)
  })

  return new Discussion({
    number: discussion.number,
    category: discussion.category.name,
    data: new DataSet(data)
  })
}

class LogThread {
  issue: Issue
  type: string

  constructor(issue: Issue, type: string) {
    this.issue = issue
    this.type = type
  }

  start() {
    console.log(`[#${this.issue.number}] ${this.type}: Issue #${this.issue.number}`)
  }

  warn(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── WARNING: ${message}`)
  }

  error(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── ERROR: ${message}`)
  }

  info(message: string) {
    console.log(`[#${this.issue.number}] ${this.type}: └── INFO: ${message}`)
  }
}

export function createThread(issue: Issue, type: string): LogThread {
  return new LogThread(issue, type)
}
