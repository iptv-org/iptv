export type RegionSerializedData = {
  code: string
  name: string
  countryCodes: string[]
  countries?: CountrySerializedData[]
  subdivisions?: SubdivisionSerializedData[]
}

export type RegionData = {
  code: string
  name: string
  countries: string[]
}
