import { Collection, Dictionary } from '@freearhey/core'
import { Region, Language, Subdivision } from '.'
import type { CountryData, CountrySerializedData } from '../types/country'
import { SubdivisionSerializedData } from '../types/subdivision'
import { RegionSerializedData } from '../types/region'

export class Country {
  code: string
  name: string
  flag: string
  languageCode: string
  language?: Language
  subdivisions?: Collection
  regions?: Collection

  constructor(data?: CountryData) {
    if (!data) return

    this.code = data.code
    this.name = data.name
    this.flag = data.flag
    this.languageCode = data.lang
  }

  withSubdivisions(subdivisionsGroupedByCountryCode: Dictionary): this {
    this.subdivisions = subdivisionsGroupedByCountryCode.get(this.code) || new Collection()

    return this
  }

  withRegions(regions: Collection): this {
    this.regions = regions.filter(
      (region: Region) => region.code !== 'INT' && region.includesCountryCode(this.code)
    )

    return this
  }

  withLanguage(languagesKeyByCode: Dictionary): this {
    this.language = languagesKeyByCode.get(this.languageCode)

    return this
  }

  getLanguage(): Language | undefined {
    return this.language
  }

  getRegions(): Collection {
    return this.regions || new Collection()
  }

  getSubdivisions(): Collection {
    return this.subdivisions || new Collection()
  }

  serialize(): CountrySerializedData {
    return {
      code: this.code,
      name: this.name,
      flag: this.flag,
      languageCode: this.languageCode,
      language: this.language ? this.language.serialize() : null,
      subdivisions: this.subdivisions
        ? this.subdivisions.map((subdivision: Subdivision) => subdivision.serialize()).all()
        : [],
      regions: this.regions ? this.regions.map((region: Region) => region.serialize()).all() : []
    }
  }

  deserialize(data: CountrySerializedData): this {
    this.code = data.code
    this.name = data.name
    this.flag = data.flag
    this.languageCode = data.languageCode
    this.language = data.language ? new Language().deserialize(data.language) : undefined
    this.subdivisions = new Collection(data.subdivisions).map((data: SubdivisionSerializedData) =>
      new Subdivision().deserialize(data)
    )
    this.regions = new Collection(data.regions).map((data: RegionSerializedData) =>
      new Region().deserialize(data)
    )

    return this
  }
}
