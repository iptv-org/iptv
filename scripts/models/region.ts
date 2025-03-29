import { Collection, Dictionary } from '@freearhey/core'
import { Subdivision } from '.'

type RegionData = {
  code: string
  name: string
  countries: string[]
}

export class Region {
  code: string
  name: string
  countryCodes: Collection
  countries?: Collection
  subdivisions?: Collection

  constructor(data: RegionData) {
    this.code = data.code
    this.name = data.name
    this.countryCodes = new Collection(data.countries)
  }

  withCountries(countriesGroupedByCode: Dictionary): this {
    this.countries = this.countryCodes.map((code: string) => countriesGroupedByCode.get(code))

    return this
  }

  withSubdivisions(subdivisions: Collection): this {
    this.subdivisions = subdivisions.filter(
      (subdivision: Subdivision) => this.countryCodes.indexOf(subdivision.countryCode) > -1
    )

    return this
  }

  getSubdivisions(): Collection {
    return this.subdivisions || new Collection()
  }

  getCountries(): Collection {
    return this.countries || new Collection()
  }

  includesCountryCode(code: string): boolean {
    return this.countryCodes.includes((countryCode: string) => countryCode === code)
  }

  isWorldwide(): boolean {
    return this.code === 'INT'
  }
}
