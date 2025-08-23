import { Collection, Dictionary } from '@freearhey/core'
import { Country, Region, Subdivision } from '.'
import type { CityData, CitySerializedData } from '../types/city'

export class City {
  code: string
  name: string
  countryCode: string
  country?: Country
  subdivisionCode?: string
  subdivision?: Subdivision
  wikidataId: string
  regions?: Collection

  constructor(data?: CityData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
    this.subdivisionCode = data.subdivision || undefined
    this.wikidataId = data.wikidata_id
  }

  withCountry(countriesKeyByCode: Dictionary): this {
    this.country = countriesKeyByCode.get(this.countryCode)

    return this
  }

  withSubdivision(subdivisionsKeyByCode: Dictionary): this {
    if (!this.subdivisionCode) return this

    this.subdivision = subdivisionsKeyByCode.get(this.subdivisionCode)

    return this
  }

  withRegions(regions: Collection): this {
    this.regions = regions.filter((region: Region) =>
      region.countryCodes.includes(this.countryCode)
    )

    return this
  }

  getRegions(): Collection {
    if (!this.regions) return new Collection()

    return this.regions
  }

  serialize(): CitySerializedData {
    return {
      code: this.code,
      name: this.name,
      countryCode: this.countryCode,
      country: this.country ? this.country.serialize() : undefined,
      subdivisionCode: this.subdivisionCode || null,
      subdivision: this.subdivision ? this.subdivision.serialize() : undefined,
      wikidataId: this.wikidataId
    }
  }

  deserialize(data: CitySerializedData): this {
    this.code = data.code
    this.name = data.name
    this.countryCode = data.countryCode
    this.country = data.country ? new Country().deserialize(data.country) : undefined
    this.subdivisionCode = data.subdivisionCode || undefined
    this.subdivision = data.subdivision
      ? new Subdivision().deserialize(data.subdivision)
      : undefined
    this.wikidataId = data.wikidataId

    return this
  }
}
