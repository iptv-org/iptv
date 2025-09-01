import { CountrySerializedData } from './country'

export type SubdivisionSerializedData = {
  code: string
  name: string
  countryCode: string
  country?: CountrySerializedData
  parentCode: string | null
}

export type SubdivisionData = {
  code: string
  name: string
  country: string
  parent: string | null
}
