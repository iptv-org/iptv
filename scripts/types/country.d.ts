import type { LanguageSerializedData } from './language'
import type { SubdivisionSerializedData } from './subdivision'
import type { RegionSerializedData } from './region'

export type CountrySerializedData = {
  code: string
  name: string
  flag: string
  languageCode: string
  language: LanguageSerializedData | null
  subdivisions: SubdivisionSerializedData[]
  regions: RegionSerializedData[]
}

export type CountryData = {
  code: string
  name: string
  lang: string
  flag: string
}
