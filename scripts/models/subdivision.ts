import { Dictionary } from '@freearhey/core'
import { Country } from '.'

type SubdivisionData = {
  code: string
  name: string
  country: string
}

export class Subdivision {
  code: string
  name: string
  countryCode: string
  country?: Country

  constructor(data: SubdivisionData) {
    this.code = data.code
    this.name = data.name
    this.countryCode = data.country
  }

  withCountry(countriesGroupedByCode: Dictionary): this {
    this.country = countriesGroupedByCode.get(this.countryCode)

    return this
  }
}
