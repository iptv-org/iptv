import { Collection, Dictionary } from '@freearhey/core'
import { Region, Language } from '.'

type CountryData = {
  code: string
  name: string
  lang: string
  flag: string
}

export class Country {
  code: string
  name: string
  flag: string
  languageCode: string
  language?: Language
  subdivisions?: Collection
  regions?: Collection

  constructor(data: CountryData) {
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

  withLanguage(languagesGroupedByCode: Dictionary): this {
    this.language = languagesGroupedByCode.get(this.languageCode)

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
}
