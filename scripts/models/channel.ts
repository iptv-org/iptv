import { Collection, Dictionary } from '@freearhey/core'
import { Category, Country, Feed, Guide, Logo, Stream, Subdivision } from './index'
import type { ChannelData, ChannelSearchableData, ChannelSerializedData } from '../types/channel'

export class Channel {
  id: string
  name: string
  altNames: Collection
  network?: string
  owners: Collection
  countryCode: string
  country?: Country
  subdivisionCode?: string
  subdivision?: Subdivision
  cityName?: string
  categoryIds: Collection
  categories: Collection = new Collection()
  isNSFW: boolean
  launched?: string
  closed?: string
  replacedBy?: string
  isClosed: boolean
  website?: string
  feeds?: Collection
  logos: Collection = new Collection()

  constructor(data?: ChannelData) {
    if (!data) return

    this.id = data.id
    this.name = data.name
    this.altNames = new Collection(data.alt_names)
    this.network = data.network || undefined
    this.owners = new Collection(data.owners)
    this.countryCode = data.country
    this.subdivisionCode = data.subdivision || undefined
    this.cityName = data.city || undefined
    this.categoryIds = new Collection(data.categories)
    this.isNSFW = data.is_nsfw
    this.launched = data.launched || undefined
    this.closed = data.closed || undefined
    this.replacedBy = data.replaced_by || undefined
    this.website = data.website || undefined
    this.isClosed = !!data.closed || !!data.replaced_by
  }

  withSubdivision(subdivisionsKeyByCode: Dictionary): this {
    if (!this.subdivisionCode) return this

    this.subdivision = subdivisionsKeyByCode.get(this.subdivisionCode)

    return this
  }

  withCountry(countriesKeyByCode: Dictionary): this {
    this.country = countriesKeyByCode.get(this.countryCode)

    return this
  }

  withCategories(categoriesKeyById: Dictionary): this {
    this.categories = this.categoryIds
      .map((id: string) => categoriesKeyById.get(id))
      .filter(Boolean)

    return this
  }

  withFeeds(feedsGroupedByChannelId: Dictionary): this {
    this.feeds = new Collection(feedsGroupedByChannelId.get(this.id))

    return this
  }

  withLogos(logosGroupedByChannelId: Dictionary): this {
    if (this.id) this.logos = new Collection(logosGroupedByChannelId.get(this.id))

    return this
  }

  getCountry(): Country | undefined {
    return this.country
  }

  getSubdivision(): Subdivision | undefined {
    return this.subdivision
  }

  getCategories(): Collection {
    return this.categories || new Collection()
  }

  hasCategories(): boolean {
    return !!this.categories && this.categories.notEmpty()
  }

  hasCategory(category: Category): boolean {
    return (
      !!this.categories &&
      this.categories.includes((_category: Category) => _category.id === category.id)
    )
  }

  getFeeds(): Collection {
    if (!this.feeds) return new Collection()

    return this.feeds
  }

  getGuides(): Collection {
    let guides = new Collection()

    this.getFeeds().forEach((feed: Feed) => {
      guides = guides.concat(feed.getGuides())
    })

    return guides
  }

  getGuideNames(): Collection {
    return this.getGuides()
      .map((guide: Guide) => guide.siteName)
      .uniq()
  }

  getStreams(): Collection {
    let streams = new Collection()

    this.getFeeds().forEach((feed: Feed) => {
      streams = streams.concat(feed.getStreams())
    })

    return streams
  }

  getStreamTitles(): Collection {
    return this.getStreams()
      .map((stream: Stream) => stream.getTitle())
      .uniq()
  }

  getFeedFullNames(): Collection {
    return this.getFeeds()
      .map((feed: Feed) => feed.getFullName())
      .uniq()
  }

  isSFW(): boolean {
    return this.isNSFW === false
  }

  getLogos(): Collection {
    function feed(logo: Logo): number {
      if (!logo.feed) return 1
      if (logo.feed.isMain) return 1

      return 0
    }

    function format(logo: Logo): number {
      const levelByFormat = { SVG: 0, PNG: 3, APNG: 1, WebP: 1, AVIF: 1, JPEG: 2, GIF: 1 }

      return logo.format ? levelByFormat[logo.format] : 0
    }

    function size(logo: Logo): number {
      return Math.abs(512 - logo.width) + Math.abs(512 - logo.height)
    }

    return this.logos.orderBy([feed, format, size], ['desc', 'desc', 'asc'], false)
  }

  getLogo(): Logo | undefined {
    return this.getLogos().first()
  }

  hasLogo(): boolean {
    return this.getLogos().notEmpty()
  }

  getSearchable(): ChannelSearchableData {
    return {
      id: this.id,
      name: this.name,
      altNames: this.altNames.all(),
      guideNames: this.getGuideNames().all(),
      streamTitles: this.getStreamTitles().all(),
      feedFullNames: this.getFeedFullNames().all()
    }
  }

  serialize(): ChannelSerializedData {
    return {
      id: this.id,
      name: this.name,
      altNames: this.altNames.all(),
      network: this.network,
      owners: this.owners.all(),
      countryCode: this.countryCode,
      country: this.country ? this.country.serialize() : undefined,
      subdivisionCode: this.subdivisionCode,
      subdivision: this.subdivision ? this.subdivision.serialize() : undefined,
      cityName: this.cityName,
      categoryIds: this.categoryIds.all(),
      categories: this.categories.map((category: Category) => category.serialize()).all(),
      isNSFW: this.isNSFW,
      launched: this.launched,
      closed: this.closed,
      replacedBy: this.replacedBy,
      website: this.website
    }
  }

  deserialize(data: ChannelSerializedData): this {
    this.id = data.id
    this.name = data.name
    this.altNames = new Collection(data.altNames)
    this.network = data.network
    this.owners = new Collection(data.owners)
    this.countryCode = data.countryCode
    this.country = data.country ? new Country().deserialize(data.country) : undefined
    this.subdivisionCode = data.subdivisionCode
    this.cityName = data.cityName
    this.categoryIds = new Collection(data.categoryIds)
    this.isNSFW = data.isNSFW
    this.launched = data.launched
    this.closed = data.closed
    this.replacedBy = data.replacedBy
    this.website = data.website

    return this
  }
}
