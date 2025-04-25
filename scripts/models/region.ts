import { Collection, Dictionary } from '@freearhey/core'
import { Country, Subdivision } from '.'
import type { RegionData, RegionSerializedData } from '../types/region'
import { CountrySerializedData } from '../types/country'
import { SubdivisionSerializedData } from '../types/subdivision'

export class Region {
  code: string
  name: string
  countryCodes: Collection
  countries: Collection = new Collection()
  subdivisions: Collection = new Collection()

  constructor(data?: RegionData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
    this.countryCodes = new Collection(data.countries)
  }

  withCountries(countriesKeyByCode: Dictionary): this {
    this.countries = this.countryCodes.map((code: string) => countriesKeyByCode.get(code))

    return this
  }

  withSubdivisions(subdivisions: Collection): this {
    this.subdivisions = subdivisions.filter(
      (subdivision: Subdivision) => this.countryCodes.indexOf(subdivision.countryCode) > -1
    )

    return this
  }

  getSubdivisions(): Collection {
    return this.subdivisions
  }

  getCountries(): Collection {
    return this.countries
  }

  includesCountryCode(code: string): boolean {
    return this.countryCodes.includes((countryCode: string) => countryCode === code)
  }

  isWorldwide(): boolean {
    return this.code === 'INT'
  }

  serialize(): RegionSerializedData {
    return {
      code: this.code,
      name: this.name,
      countryCodes: this.countryCodes.all(),
      countries: this.countries.map((country: Country) => country.serialize()).all(),
      subdivisions: this.subdivisions
        .map((subdivision: Subdivision) => subdivision.serialize())
        .all()
    }
  }

  deserialize(data: RegionSerializedData): this {
    this.code = data.code
    this.name = data.name
    this.countryCodes = new Collection(data.countryCodes)
    this.countries = new Collection(data.countries).map((data: CountrySerializedData) =>
      new Country().deserialize(data)
    )
    this.subdivisions = new Collection(data.subdivisions).map((data: SubdivisionSerializedData) =>
      new Subdivision().deserialize(data)
    )

    return this
  }
}
