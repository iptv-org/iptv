import { Collection, Dictionary } from '@freearhey/core'
import { Category, Country, Subdivision } from './index'

type ChannelData = {
  id: string
  name: string
  alt_names: string[]
  network: string
  owners: Collection
  country: string
  subdivision: string
  city: string
  categories: Collection
  is_nsfw: boolean
  launched: string
  closed: string
  replaced_by: string
  website: string
  logo: string
}

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
  categories?: Collection
  isNSFW: boolean
  launched?: string
  closed?: string
  replacedBy?: string
  website?: string
  logo: string

  constructor(data: ChannelData) {
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

  withSubdivision(subdivisionsGroupedByCode: Dictionary): this {
    if (!this.subdivisionCode) return this

    this.subdivision = subdivisionsGroupedByCode.get(this.subdivisionCode)

    return this
  }

  withCountry(countriesGroupedByCode: Dictionary): this {
    this.country = countriesGroupedByCode.get(this.countryCode)

    return this
  }

  withCategories(groupedCategories: Dictionary): this {
    this.categories = this.categoryIds
      .map((id: string) => groupedCategories.get(id))
      .filter(Boolean)

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

  isSFW(): boolean {
    return this.isNSFW === false
  }
}
