import { CountrySerializedData } from './country'
import { SubdivisionSerializedData } from './subdivision'

export type CitySerializedData = {
  code: string
  name: string
  countryCode: string
  country?: CountrySerializedData
  subdivisionCode: string | null
  subdivision?: SubdivisionSerializedData
  wikidataId: string
}

export type CityData = {
  code: string
  name: string
  country: string
  subdivision: string | null
  wikidata_id: string
}
