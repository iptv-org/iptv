import { SubdivisionData, SubdivisionSerializedData } from '../types/subdivision'
import { Dictionary } from '@freearhey/core'
import { Country } from '.'

export class Subdivision {
  code: string
  name: string
  countryCode: string
  country?: Country

  constructor(data?: SubdivisionData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
  }

  withCountry(countriesKeyByCode: Dictionary): this {
    this.country = countriesKeyByCode.get(this.countryCode)

    return this
  }

  serialize(): SubdivisionSerializedData {
    return {
      code: this.code,
      name: this.name,
      countryCode: this.code,
      country: this.country ? this.country.serialize() : undefined
    }
  }

  deserialize(data: SubdivisionSerializedData): this {
    this.code = data.code
    this.name = data.name
    this.countryCode = data.countryCode
    this.country = data.country ? new Country().deserialize(data.country) : undefined

    return this
  }
}
