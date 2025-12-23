import { Collection } from '@freearhey/core'
import parser from 'iptv-playlist-parser'
import { normalizeURL } from '../utils'
import * as sdk from '@iptv-org/sdk'
import { IssueData } from '../core'
import { data } from '../api'
import path from 'node:path'

export class Stream extends sdk.Models.Stream {
  filepath?: string
  line?: number
  groupTitle: string = 'Undefined'
  removed: boolean = false
  tvgId?: string
  label: string | null
  statusCode?: string

  updateWithIssue(issueData: IssueData): this {
    const data = {
      label: issueData.getString('label'),
      quality: issueData.getString('quality'),
      httpUserAgent: issueData.getString('http_user_agent'),
      httpReferrer: issueData.getString('http_referrer')
    }

    if (data.label !== undefined) this.label = data.label
    if (data.quality !== undefined) this.quality = data.quality
    if (data.httpUserAgent !== undefined) this.user_agent = data.httpUserAgent
    if (data.httpReferrer !== undefined) this.referrer = data.httpReferrer

    return this
  }

  static fromPlaylistItem(data: parser.PlaylistItem): Stream {
    function escapeRegExp(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
    }

    function parseName(name: string): {
      title: string
      label: string
      quality: string
    } {
      let title = name
      const [, label] = title.match(/ \[(.*)\]$/) || [null, '']
      title = title.replace(new RegExp(` \\[${escapeRegExp(label)}\\]$`), '')
      const [, quality] = title.match(/ \(([0-9]+[p|i])\)$/) || [null, '']
      title = title.replace(new RegExp(` \\(${quality}\\)$`), '')

      return { title, label, quality }
    }

    if (!data.name) throw new Error('"name" property is required')
    if (!data.url) throw new Error('"url" property is required')

    const [channelId, feedId] = data.tvg.id.split('@')
    const { title, label, quality } = parseName(data.name)

    const stream = new Stream({
      channel: channelId || null,
      feed: feedId || null,
      title: title,
      quality: quality || null,
      url: data.url,
      referrer: data.http.referrer || null,
      user_agent: data.http['user-agent'] || null
    })

    stream.tvgId = data.tvg.id
    stream.line = data.line
    stream.label = label || null

    return stream
  }

  isSFW(): boolean {
    const channel = this.getChannel()

    if (!channel) return true

    return !channel.is_nsfw
  }

  getUniqKey(): string {
    const filepath = this.getFilepath()
    const tvgId = this.getTvgId()

    return filepath + tvgId + this.url
  }

  getVerticalResolution(): number {
    if (!this.quality) return 0

    const [, verticalResolutionString] = this.quality.match(/^(\d+)/) || ['', '0']

    return parseInt(verticalResolutionString)
  }

  getBroadcastCountries(): Collection<sdk.Models.Country> {
    const countries = new Collection<sdk.Models.Country>()

    const feed = this.getFeed()
    if (!feed) return countries

    feed
      .getBroadcastArea()
      .getLocations()
      .forEach((location: sdk.Models.BroadcastAreaLocation) => {
        let country: sdk.Models.Country | undefined
        switch (location.type) {
          case 'country': {
            country = data.countriesKeyByCode.get(location.code)
            break
          }
          case 'subdivision': {
            const subdivision = data.subdivisionsKeyByCode.get(location.code)
            if (!subdivision) break
            country = data.countriesKeyByCode.get(subdivision.country)
            break
          }
          case 'city': {
            const city = data.citiesKeyByCode.get(location.code)
            if (!city) break
            country = data.countriesKeyByCode.get(city.country)
            break
          }
        }

        if (country) countries.add(country)
      })

    return countries.uniqBy((country: sdk.Models.Country) => country.code)
  }

  getBroadcastSubdivisions(): Collection<sdk.Models.Subdivision> {
    const subdivisions = new Collection<sdk.Models.Subdivision>()

    const feed = this.getFeed()
    if (!feed) return subdivisions

    feed
      .getBroadcastArea()
      .getLocations()
      .forEach((location: sdk.Models.BroadcastAreaLocation) => {
        switch (location.type) {
          case 'subdivision': {
            const subdivision = data.subdivisionsKeyByCode.get(location.code)
            if (!subdivision) break
            subdivisions.add(subdivision)
            if (!subdivision.parent) break
            const parentSubdivision = data.subdivisionsKeyByCode.get(subdivision.parent)
            if (!parentSubdivision) break
            subdivisions.add(parentSubdivision)
            break
          }
          case 'city': {
            const city = data.citiesKeyByCode.get(location.code)
            if (!city || !city.subdivision) break
            const subdivision = data.subdivisionsKeyByCode.get(city.subdivision)
            if (!subdivision) break
            subdivisions.add(subdivision)
            if (!subdivision.parent) break
            const parentSubdivision = data.subdivisionsKeyByCode.get(subdivision.parent)
            if (!parentSubdivision) break
            subdivisions.add(parentSubdivision)
            break
          }
        }
      })

    return subdivisions.uniqBy((subdivision: sdk.Models.Subdivision) => subdivision.code)
  }

  getBroadcastCities(): Collection<sdk.Models.City> {
    const cities = new Collection<sdk.Models.City>()

    const feed = this.getFeed()
    if (!feed) return cities

    feed
      .getBroadcastArea()
      .getLocations()
      .forEach((location: sdk.Models.BroadcastAreaLocation) => {
        if (location.type !== 'city') return

        const city = data.citiesKeyByCode.get(location.code)

        if (city) cities.add(city)
      })

    return cities.uniqBy((city: sdk.Models.City) => city.code)
  }

  getBroadcastRegions(): Collection<sdk.Models.Region> {
    const regions = new Collection<sdk.Models.Region>()

    const feed = this.getFeed()
    if (!feed) return regions

    feed
      .getBroadcastArea()
      .getLocations()
      .forEach((location: sdk.Models.BroadcastAreaLocation) => {
        switch (location.type) {
          case 'region': {
            const region = data.regionsKeyByCode.get(location.code)
            if (!region) break
            regions.add(region)

            const relatedRegions = data.regions.filter((_region: sdk.Models.Region) =>
              new Collection<string>(_region.countries)
                .intersects(new Collection<string>(region.countries))
                .isNotEmpty()
            )
            relatedRegions.forEach(region => {
              regions.add(region)
            })
            break
          }
          case 'country': {
            const country = data.countriesKeyByCode.get(location.code)
            if (!country) break
            const countryRegions = data.regions.filter((_region: sdk.Models.Region) =>
              new Collection<string>(_region.countries).includes(
                (code: string) => code === country.code
              )
            )
            countryRegions.forEach(region => {
              regions.add(region)
            })
            break
          }
          case 'subdivision': {
            const subdivision = data.subdivisionsKeyByCode.get(location.code)
            if (!subdivision) break
            const subdivisionRegions = data.regions.filter((_region: sdk.Models.Region) =>
              new Collection<string>(_region.countries).includes(
                (code: string) => code === subdivision.country
              )
            )
            subdivisionRegions.forEach(region => {
              regions.add(region)
            })
            break
          }
          case 'city': {
            const city = data.citiesKeyByCode.get(location.code)
            if (!city) break
            const cityRegions = data.regions.filter((_region: sdk.Models.Region) =>
              new Collection<string>(_region.countries).includes(
                (code: string) => code === city.country
              )
            )
            cityRegions.forEach(region => {
              regions.add(region)
            })
            break
          }
        }
      })

    return regions.uniqBy((region: sdk.Models.Region) => region.code)
  }

  isInternational(): boolean {
    const feed = this.getFeed()
    if (!feed) return false

    const broadcastAreaCodes = feed.getBroadcastArea().codes
    if (broadcastAreaCodes.join(';').includes('r/')) return true
    if (broadcastAreaCodes.filter(code => code.includes('c/')).length > 1) return true

    return false
  }

  hasCategory(category: sdk.Models.Category): boolean {
    const channel = this.getChannel()

    if (!channel) return false

    const found = channel.categories.find((id: string) => id === category.id)

    return !!found
  }

  hasLanguage(language: sdk.Models.Language): boolean {
    const found = this.getLanguages().find(
      (_language: sdk.Models.Language) => _language.code === language.code
    )

    return !!found
  }

  updateTvgId(): this {
    if (!this.channel) return this
    if (this.feed) {
      this.tvgId = `${this.channel}@${this.feed}`
    } else {
      this.tvgId = this.channel
    }

    return this
  }

  updateFilepath(): this {
    const channel = this.getChannel()
    if (!channel) return this

    this.filepath = `${channel.country.toLowerCase()}.m3u`

    return this
  }

  updateTitle(): this {
    const channel = this.getChannel()

    if (!channel) return this

    const feed = this.getFeed()

    this.title = channel.name
    if (feed && !feed.is_main) {
      this.title += ` ${feed.name}`
    }

    return this
  }

  normalizeURL() {
    this.url = normalizeURL(this.url)
  }

  getLogos(): Collection<sdk.Models.Logo> {
    const logos = super.getLogos()

    if (logos.isEmpty()) return new Collection()

    function format(logo: sdk.Models.Logo): number {
      const levelByFormat = { SVG: 0, PNG: 3, APNG: 1, WebP: 1, AVIF: 1, JPEG: 2, GIF: 1 }

      return logo.format ? levelByFormat[logo.format] : 0
    }

    function size(logo: sdk.Models.Logo): number {
      return Math.abs(512 - logo.width) + Math.abs(512 - logo.height)
    }

    return logos.sortBy([format, size], ['desc', 'asc'], false)
  }

  getFilepath(): string {
    return this.filepath || ''
  }

  getFilename(): string {
    return path.basename(this.getFilepath())
  }

  getLine(): number {
    return this.line || -1
  }

  getTvgId(): string {
    if (this.tvgId) return this.tvgId

    return this.getId()
  }

  getTvgLogo(): string {
    const logo = this.getLogos().first()

    return logo ? logo.url : ''
  }

  getFullTitle(): string {
    let title = `${this.title}`

    if (this.quality) {
      title += ` (${this.quality})`
    }

    if (this.label) {
      title += ` [${this.label}]`
    }

    return title
  }

  toString(options: { public?: boolean } = {}) {
    options = { ...{ public: false }, ...options }

    let output = `#EXTINF:-1 tvg-id="${this.getTvgId()}"`

    if (options.public) {
      output += ` tvg-logo="${this.getTvgLogo()}"`

      if (this.referrer) {
        output += ` http-referrer="${this.referrer}"`
      }

      if (this.user_agent) {
        output += ` http-user-agent="${this.user_agent}"`
      }

      output += ` group-title="${this.groupTitle}"`
    }

    output += `,${this.getFullTitle()}`

    if (this.referrer) {
      output += `\r\n#EXTVLCOPT:http-referrer=${this.referrer}`
    }

    if (this.user_agent) {
      output += `\r\n#EXTVLCOPT:http-user-agent=${this.user_agent}`
    }

    output += `\r\n${this.url}`

    return output
  }

  toObject(): sdk.Types.StreamData {
    let feedId = this.feed
    if (!feedId) {
      const feed = this.getFeed()
      if (feed) feedId = feed.id
    }

    return {
      channel: this.channel,
      feed: feedId,
      title: this.title,
      url: this.url,
      quality: this.quality,
      user_agent: this.user_agent,
      referrer: this.referrer
    }
  }

  clone(): Stream {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
  }
}
