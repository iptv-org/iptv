import { SubdivisionData, SubdivisionSerializedData } from '../types/subdivision'
import { Dictionary, Collection } from '@freearhey/core'
import { Country, Region } from '.'

export class Subdivision {
  code: string
  name: string
  countryCode: string
  country?: Country
  parentCode?: string
  parent?: Subdivision
  regions?: Collection
  cities?: Collection

  constructor(data?: SubdivisionData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
    this.parentCode = data.parent || undefined
  }

  withCountry(countriesKeyByCode: Dictionary): this {
    this.country = countriesKeyByCode.get(this.countryCode)

    return this
  }

  withRegions(regions: Collection): this {
    this.regions = regions.filter((region: Region) =>
      region.countryCodes.includes(this.countryCode)
    )

    return this
  }

  withCities(citiesGroupedBySubdivisionCode: Dictionary): this {
    this.cities = new Collection(citiesGroupedBySubdivisionCode.get(this.code))

    return this
  }

  withParent(subdivisionsKeyByCode: Dictionary): this {
    if (!this.parentCode) return this

    this.parent = subdivisionsKeyByCode.get(this.parentCode)

    return this
  }

  getRegions(): Collection {
    if (!this.regions) return new Collection()

    return this.regions
  }

  getCities(): Collection {
    if (!this.cities) return new Collection()

    return this.cities
  }

  serialize(): SubdivisionSerializedData {
    return {
      code: this.code,
      name: this.name,
      countryCode: this.countryCode,
      country: this.country ? this.country.serialize() : undefined,
      parentCode: this.parentCode || null
    }
  }

  deserialize(data: SubdivisionSerializedData): this {
    this.code = data.code
    this.name = data.name
    this.countryCode = data.countryCode
    this.country = data.country ? new Country().deserialize(data.country) : undefined
    this.parentCode = data.parentCode || undefined

    return this
  }
}
