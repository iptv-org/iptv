import { Collection } from '@freearhey/core'
import type { CountrySerializedData } from './country'
import type { SubdivisionSerializedData } from './subdivision'
import type { CategorySerializedData } from './category'

export type ChannelSerializedData = {
  id: string
  name: string
  altNames: string[]
  network?: string
  owners: string[]
  countryCode: string
  country?: CountrySerializedData
  subdivisionCode?: string
  subdivision?: SubdivisionSerializedData
  cityName?: string
  categoryIds: string[]
  categories?: CategorySerializedData[]
  isNSFW: boolean
  launched?: string
  closed?: string
  replacedBy?: string
  website?: string
}

export type ChannelData = {
  id: string
  name: string
  alt_names: string[]
  network: string
  owners: Collection
  country: string
  subdivision: string
  city: string
  categories: Collection
  is_nsfw: boolean
  launched: string
  closed: string
  replaced_by: string
  website: string
}

export type ChannelSearchableData = {
  id: string
  name: string
  altNames: string[]
  guideNames: string[]
  streamTitles: string[]
  feedFullNames: string[]
}
