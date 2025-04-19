import { Collection, Dictionary } from '@freearhey/core'
import { Category, Country, Feed, Guide, Stream, Subdivision } from './index'
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
  website?: string
  logo: string
  feeds?: Collection

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
    this.logo = data.logo
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

  getStreamNames(): Collection {
    return this.getStreams()
      .map((stream: Stream) => stream.getName())
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

  getSearchable(): ChannelSearchableData {
    return {
      id: this.id,
      name: this.name,
      altNames: this.altNames.all(),
      guideNames: this.getGuideNames().all(),
      streamNames: this.getStreamNames().all(),
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
      website: this.website,
      logo: this.logo
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
    this.logo = data.logo

    return this
  }
}
