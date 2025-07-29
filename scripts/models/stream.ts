import { Feed, Channel, Category, Region, Subdivision, Country, Language, Logo } from './index'
import { URL, Collection, Dictionary } from '@freearhey/core'
import type { StreamData } from '../types/stream'
import parser from 'iptv-playlist-parser'
import { IssueData } from '../core'
import path from 'node:path'

export class Stream {
  title: string
  url: string
  id?: string
  channelId?: string
  channel?: Channel
  feedId?: string
  feed?: Feed
  logos: Collection = new Collection()
  filepath?: string
  line?: number
  label?: string
  verticalResolution?: number
  isInterlaced?: boolean
  referrer?: string
  userAgent?: string
  groupTitle: string = 'Undefined'
  removed: boolean = false
  directives: Collection = new Collection()

  constructor(data?: StreamData) {
    if (!data) return

    const id =
      data.channelId && data.feedId ? [data.channelId, data.feedId].join('@') : data.channelId
    const { verticalResolution, isInterlaced } = parseQuality(data.quality)

    this.id = id || undefined
    this.channelId = data.channelId || undefined
    this.feedId = data.feedId || undefined
    this.title = data.title || ''
    this.url = data.url
    this.referrer = data.referrer || undefined
    this.userAgent = data.userAgent || undefined
    this.verticalResolution = verticalResolution || undefined
    this.isInterlaced = isInterlaced || undefined
    this.label = data.label || undefined
    this.directives = new Collection(data.directives)
  }

  update(issueData: IssueData): this {
    const data = {
      label: issueData.getString('label'),
      quality: issueData.getString('quality'),
      httpUserAgent: issueData.getString('httpUserAgent'),
      httpReferrer: issueData.getString('httpReferrer'),
      newStreamUrl: issueData.getString('newStreamUrl'),
      directives: issueData.getArray('directives')
    }

    if (data.label !== undefined) this.label = data.label
    if (data.quality !== undefined) this.setQuality(data.quality)
    if (data.httpUserAgent !== undefined) this.userAgent = data.httpUserAgent
    if (data.httpReferrer !== undefined) this.referrer = data.httpReferrer
    if (data.newStreamUrl !== undefined) this.url = data.newStreamUrl
    if (data.directives !== undefined) this.directives = new Collection(data.directives)

    return this
  }

  fromPlaylistItem(data: parser.PlaylistItem): this {
    function parseName(name: string): {
      title: string
      label: string
      quality: string
    } {
      let title = name
      const [, label] = title.match(/ \[(.*)\]$/) || [null, '']
      title = title.replace(new RegExp(` \\[${escapeRegExp(label)}\\]$`), '')
      const [, quality] = title.match(/ \(([0-9]+p)\)$/) || [null, '']
      title = title.replace(new RegExp(` \\(${quality}\\)$`), '')

      return { title, label, quality }
    }

    function parseDirectives(string: string) {
      const directives = new Collection()

      if (!string) return directives

      const supportedDirectives = ['#EXTVLCOPT', '#KODIPROP']
      const lines = string.split('\r\n')
      const regex = new RegExp(`^${supportedDirectives.join('|')}`, 'i')

      lines.forEach((line: string) => {
        if (regex.test(line)) {
          directives.add(line.trim())
        }
      })

      return directives
    }

    if (!data.name) throw new Error('"name" property is required')
    if (!data.url) throw new Error('"url" property is required')

    const [channelId, feedId] = data.tvg.id.split('@')
    const { title, label, quality } = parseName(data.name)
    const { verticalResolution, isInterlaced } = parseQuality(quality)

    this.id = data.tvg.id || undefined
    this.feedId = feedId || undefined
    this.channelId = channelId || undefined
    this.line = data.line
    this.label = label || undefined
    this.title = title
    this.verticalResolution = verticalResolution || undefined
    this.isInterlaced = isInterlaced || undefined
    this.url = data.url
    this.referrer = data.http.referrer || undefined
    this.userAgent = data.http['user-agent'] || undefined
    this.directives = parseDirectives(data.raw)

    return this
  }

  withChannel(channelsKeyById: Dictionary): this {
    if (!this.channelId) return this

    this.channel = channelsKeyById.get(this.channelId)

    return this
  }

  withFeed(feedsGroupedByChannelId: Dictionary): this {
    if (!this.channelId) return this

    const channelFeeds = feedsGroupedByChannelId.get(this.channelId) || []
    if (this.feedId) this.feed = channelFeeds.find((feed: Feed) => feed.id === this.feedId)
    if (!this.feedId && !this.feed) this.feed = channelFeeds.find((feed: Feed) => feed.isMain)

    return this
  }

  withLogos(logosGroupedByStreamId: Dictionary): this {
    if (this.id) this.logos = new Collection(logosGroupedByStreamId.get(this.id))

    return this
  }

  setId(id: string): this {
    this.id = id

    return this
  }

  setChannelId(channelId: string): this {
    this.channelId = channelId

    return this
  }

  setFeedId(feedId: string | undefined): this {
    this.feedId = feedId

    return this
  }

  setQuality(quality: string): this {
    const { verticalResolution, isInterlaced } = parseQuality(quality)

    this.verticalResolution = verticalResolution || undefined
    this.isInterlaced = isInterlaced || undefined

    return this
  }

  getLine(): number {
    return this.line || -1
  }

  getFilename(): string {
    if (!this.filepath) return ''

    return path.basename(this.filepath)
  }

  setFilepath(filepath: string): this {
    this.filepath = filepath

    return this
  }

  updateFilepath(): this {
    if (!this.channel) return this

    this.filepath = `${this.channel.countryCode.toLowerCase()}.m3u`

    return this
  }

  getChannelId(): string {
    return this.channelId || ''
  }

  getFeedId(): string {
    if (this.feedId) return this.feedId
    if (this.feed) return this.feed.id
    return ''
  }

  getFilepath(): string {
    return this.filepath || ''
  }

  getReferrer(): string {
    return this.referrer || ''
  }

  getUserAgent(): string {
    return this.userAgent || ''
  }

  getQuality(): string {
    if (!this.verticalResolution) return ''

    let quality = this.verticalResolution.toString()

    if (this.isInterlaced) quality += 'i'
    else quality += 'p'

    return quality
  }

  hasId(): boolean {
    return !!this.id
  }

  hasQuality(): boolean {
    return !!this.verticalResolution
  }

  getVerticalResolution(): number {
    if (!this.hasQuality()) return 0

    return parseInt(this.getQuality().replace(/p|i/, ''))
  }

  updateTitle(): this {
    if (!this.channel) return this

    this.title = this.channel.name
    if (this.feed && !this.feed.isMain) {
      this.title += ` ${this.feed.name}`
    }

    return this
  }

  updateId(): this {
    if (!this.channel) return this
    if (this.feed) {
      this.id = `${this.channel.id}@${this.feed.id}`
    } else {
      this.id = this.channel.id
    }

    return this
  }

  normalizeURL() {
    const url = new URL(this.url)

    this.url = url.normalize().toString()
  }

  clone(): Stream {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }

  hasChannel() {
    return !!this.channel
  }

  getBroadcastRegions(): Collection {
    return this.feed ? this.feed.getBroadcastRegions() : new Collection()
  }

  getBroadcastCountries(): Collection {
    return this.feed ? this.feed.getBroadcastCountries() : new Collection()
  }

  hasBroadcastArea(): boolean {
    return this.feed ? this.feed.hasBroadcastArea() : false
  }

  isSFW(): boolean {
    return this.channel ? this.channel.isSFW() : true
  }

  hasCategories(): boolean {
    return this.channel ? this.channel.hasCategories() : false
  }

  hasCategory(category: Category): boolean {
    return this.channel ? this.channel.hasCategory(category) : false
  }

  getCategoryNames(): string[] {
    return this.getCategories()
      .map((category: Category) => category.name)
      .sort()
      .all()
  }

  getCategories(): Collection {
    return this.channel ? this.channel.getCategories() : new Collection()
  }

  getLanguages(): Collection {
    return this.feed ? this.feed.getLanguages() : new Collection()
  }

  hasLanguages() {
    return this.feed ? this.feed.hasLanguages() : false
  }

  hasLanguage(language: Language) {
    return this.feed ? this.feed.hasLanguage(language) : false
  }

  getBroadcastAreaCodes(): Collection {
    return this.feed ? this.feed.broadcastAreaCodes : new Collection()
  }

  isBroadcastInSubdivision(subdivision: Subdivision): boolean {
    return this.feed ? this.feed.isBroadcastInSubdivision(subdivision) : false
  }

  isBroadcastInCountry(country: Country): boolean {
    return this.feed ? this.feed.isBroadcastInCountry(country) : false
  }

  isBroadcastInRegion(region: Region): boolean {
    return this.feed ? this.feed.isBroadcastInRegion(region) : false
  }

  isInternational(): boolean {
    return this.feed ? this.feed.isInternational() : false
  }

  getLogos(): Collection {
    function format(logo: Logo): number {
      const levelByFormat = { SVG: 0, PNG: 3, APNG: 1, WebP: 1, AVIF: 1, JPEG: 2, GIF: 1 }

      return logo.format ? levelByFormat[logo.format] : 0
    }

    function size(logo: Logo): number {
      return Math.abs(512 - logo.width) + Math.abs(512 - logo.height)
    }

    return this.logos.orderBy([format, size], ['desc', 'asc'], false)
  }

  getLogo(): Logo | undefined {
    return this.getLogos().first()
  }

  hasLogo(): boolean {
    return this.getLogos().notEmpty()
  }

  getLogoUrl(): string {
    let logo: Logo | undefined

    if (this.hasLogo()) logo = this.getLogo()
    else logo = this?.channel?.getLogo()

    return logo ? logo.url : ''
  }

  getTitle(): string {
    return this.title || ''
  }

  getFullTitle(): string {
    let title = `${this.getTitle()}`

    if (this.getQuality()) {
      title += ` (${this.getQuality()})`
    }

    if (this.label) {
      title += ` [${this.label}]`
    }

    return title
  }

  getLabel(): string {
    return this.label || ''
  }

  getId(): string {
    return this.id || ''
  }

  toJSON() {
    return {
      channel: this.channelId || null,
      feed: this.feedId || null,
      title: this.title,
      url: this.url,
      referrer: this.referrer || null,
      user_agent: this.userAgent || null,
      quality: this.getQuality() || null
    }
  }

  toString(options: { public: boolean }) {
    let output = `#EXTINF:-1 tvg-id="${this.getId()}"`

    if (options.public) {
      output += ` tvg-logo="${this.getLogoUrl()}" group-title="${this.groupTitle}"`
    }

    if (this.referrer) {
      output += ` http-referrer="${this.referrer}"`
    }

    if (this.userAgent) {
      output += ` http-user-agent="${this.userAgent}"`
    }

    output += `,${this.getFullTitle()}`

    this.directives.forEach((prop: string) => {
      output += `\r\n${prop}`
    })

    output += `\r\n${this.url}`

    return output
  }
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

function parseQuality(quality: string | null): {
  verticalResolution: number | null
  isInterlaced: boolean | null
} {
  if (!quality) return { verticalResolution: null, isInterlaced: null }
  const [, verticalResolutionString] = quality.match(/^(\d+)/) || [null, undefined]
  const isInterlaced = /i$/i.test(quality)
  let verticalResolution = 0
  if (verticalResolutionString) verticalResolution = parseInt(verticalResolutionString)

  return { verticalResolution, isInterlaced }
}
