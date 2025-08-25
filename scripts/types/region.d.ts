import { CitySerializedData } from './city'
import { CountrySerializedData } from './country'
import { SubdivisionSerializedData } from './subdivision'

export type RegionSerializedData = {
  code: string
  name: string
  countryCodes: string[]
  countries?: CountrySerializedData[]
  subdivisions?: SubdivisionSerializedData[]
  cities?: CitySerializedData[]
}

export type RegionData = {
  code: string
  name: string
  countries: string[]
}
