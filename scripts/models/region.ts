import { Collection, Dictionary } from '@freearhey/core'
import { City, Country, Subdivision } from '.'
import type { RegionData, RegionSerializedData } from '../types/region'
import { CountrySerializedData } from '../types/country'
import { SubdivisionSerializedData } from '../types/subdivision'
import { CitySerializedData } from '../types/city'

export class Region {
  code: string
  name: string
  countryCodes: Collection
  countries?: Collection
  subdivisions?: Collection
  cities?: Collection
  regions?: Collection

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

  withCities(cities: Collection): this {
    this.cities = cities.filter((city: City) => this.countryCodes.indexOf(city.countryCode) > -1)

    return this
  }

  withRegions(regions: Collection): this {
    this.regions = regions.filter(
      (region: Region) => !region.countryCodes.intersects(this.countryCodes).isEmpty()
    )

    return this
  }

  getSubdivisions(): Collection {
    if (!this.subdivisions) return new Collection()

    return this.subdivisions
  }

  getCountries(): Collection {
    if (!this.countries) return new Collection()

    return this.countries
  }

  getCities(): Collection {
    if (!this.cities) return new Collection()

    return this.cities
  }

  getRegions(): Collection {
    if (!this.regions) return new Collection()

    return this.regions
  }

  includesCountryCode(code: string): boolean {
    return this.countryCodes.includes((countryCode: string) => countryCode === code)
  }

  isWorldwide(): boolean {
    return ['INT', 'WW'].includes(this.code)
  }

  serialize(): RegionSerializedData {
    return {
      code: this.code,
      name: this.name,
      countryCodes: this.countryCodes.all(),
      countries: this.getCountries()
        .map((country: Country) => country.serialize())
        .all(),
      subdivisions: this.getSubdivisions()
        .map((subdivision: Subdivision) => subdivision.serialize())
        .all(),
      cities: this.getCities()
        .map((city: City) => city.serialize())
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
    this.cities = new Collection(data.cities).map((data: CitySerializedData) =>
      new City().deserialize(data)
    )

    return this
  }
}
