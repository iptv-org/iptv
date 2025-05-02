export type SubdivisionSerializedData = {
  code: string
  name: string
  countryCode: string
  country?: CountrySerializedData
}

export type SubdivisionData = {
  code: string
  name: string
  country: string
}
