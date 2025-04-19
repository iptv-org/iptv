import { Collection, Dictionary } from '@freearhey/core'

type TimezoneData = {
  id: string
  utc_offset: string
  countries: string[]
}

export class Timezone {
  id: string
  utcOffset: string
  countryCodes: Collection
  countries?: Collection

  constructor(data: TimezoneData) {
    this.id = data.id
    this.utcOffset = data.utc_offset
    this.countryCodes = new Collection(data.countries)
  }

  withCountries(countriesKeyByCode: Dictionary): this {
    this.countries = this.countryCodes.map((code: string) => countriesKeyByCode.get(code))

    return this
  }

  getCountries(): Collection {
    return this.countries || new Collection()
  }
}
