import { Collection } from '@freearhey/core'

type RegionProps = {
  code: string
  name: string
  countries: string[]
}

export class Region {
  code: string
  name: string
  countries: Collection

  constructor({ code, name, countries }: RegionProps) {
    this.code = code
    this.name = name
    this.countries = new Collection(countries)
  }
}
