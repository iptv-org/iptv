import { Storage } from '@freearhey/core'

export type DataLoaderProps = {
  storage: Storage
}

export type DataLoaderData = {
  countries: object | object[]
  regions: object | object[]
  subdivisions: object | object[]
  languages: object | object[]
  categories: object | object[]
  blocklist: object | object[]
  channels: object | object[]
  feeds: object | object[]
  timezones: object | object[]
  guides: object | object[]
  streams: object | object[]
}
