import { Collection, Dictionary } from '@freearhey/core'
import { Country, Language, Region, Channel, Subdivision } from './index'

type FeedData = {
  channel: string
  id: string
  name: string
  is_main: boolean
  broadcast_area: Collection
  languages: Collection
  timezones: Collection
  video_format: string
}

export class Feed {
  channelId: string
  channel?: Channel
  id: string
  name: string
  isMain: boolean
  broadcastAreaCodes: Collection
  broadcastCountryCodes: Collection
  broadcastCountries?: Collection
  broadcastRegionCodes: Collection
  broadcastRegions?: Collection
  broadcastSubdivisionCodes: Collection
  broadcastSubdivisions?: Collection
  languageCodes: Collection
  languages?: Collection
  timezoneIds: Collection
  timezones?: Collection
  videoFormat: string

  constructor(data: FeedData) {
    this.channelId = data.channel
    this.id = data.id
    this.name = data.name
    this.isMain = data.is_main
    this.broadcastAreaCodes = new Collection(data.broadcast_area)
    this.languageCodes = new Collection(data.languages)
    this.timezoneIds = new Collection(data.timezones)
    this.videoFormat = data.video_format
    this.broadcastCountryCodes = new Collection()
    this.broadcastRegionCodes = new Collection()
    this.broadcastSubdivisionCodes = new Collection()

    this.broadcastAreaCodes.forEach((areaCode: string) => {
      const [type, code] = areaCode.split('/')

      switch (type) {
        case 'c':
          this.broadcastCountryCodes.add(code)
          break
        case 'r':
          this.broadcastRegionCodes.add(code)
          break
        case 's':
          this.broadcastSubdivisionCodes.add(code)
          break
      }
    })
  }

  withChannel(channelsGroupedById: Dictionary): this {
    this.channel = channelsGroupedById.get(this.channelId)

    return this
  }

  withLanguages(languagesGroupedByCode: Dictionary): this {
    this.languages = this.languageCodes
      .map((code: string) => languagesGroupedByCode.get(code))
      .filter(Boolean)

    return this
  }

  withTimezones(timezonesGroupedById: Dictionary): this {
    this.timezones = this.timezoneIds
      .map((id: string) => timezonesGroupedById.get(id))
      .filter(Boolean)

    return this
  }

  withBroadcastSubdivisions(subdivisionsGroupedByCode: Dictionary): this {
    this.broadcastSubdivisions = this.broadcastSubdivisionCodes.map((code: string) =>
      subdivisionsGroupedByCode.get(code)
    )

    return this
  }

  withBroadcastCountries(
    countriesGroupedByCode: Dictionary,
    regionsGroupedByCode: Dictionary,
    subdivisionsGroupedByCode: Dictionary
  ): this {
    let broadcastCountries = new Collection()

    if (this.isInternational()) {
      this.broadcastCountries = broadcastCountries
      return this
    }

    this.broadcastCountryCodes.forEach((code: string) => {
      broadcastCountries.add(countriesGroupedByCode.get(code))
    })

    this.broadcastRegionCodes.forEach((code: string) => {
      const region: Region = regionsGroupedByCode.get(code)
      broadcastCountries = broadcastCountries.concat(region.countryCodes)
    })

    this.broadcastSubdivisionCodes.forEach((code: string) => {
      const subdivision: Subdivision = subdivisionsGroupedByCode.get(code)
      broadcastCountries.add(countriesGroupedByCode.get(subdivision.countryCode))
    })

    this.broadcastCountries = broadcastCountries.uniq().filter(Boolean)

    return this
  }

  withBroadcastRegions(regions: Collection): this {
    if (!this.broadcastCountries) return this
    const countriesCodes = this.broadcastCountries.map((country: Country) => country.code)

    this.broadcastRegions = regions.filter((region: Region) => {
      if (region.code === 'INT') return false

      return region.countryCodes.intersects(countriesCodes)
    })

    return this
  }

  hasBroadcastArea(): boolean {
    return (
      this.isInternational() || (!!this.broadcastCountries && this.broadcastCountries.notEmpty())
    )
  }

  getBroadcastCountries(): Collection {
    return this.broadcastCountries || new Collection()
  }

  getBroadcastRegions(): Collection {
    return this.broadcastRegions || new Collection()
  }

  getTimezones(): Collection {
    return this.timezones || new Collection()
  }

  getLanguages(): Collection {
    return this.languages || new Collection()
  }

  hasLanguages(): boolean {
    return !!this.languages && this.languages.notEmpty()
  }

  hasLanguage(language: Language): boolean {
    return (
      !!this.languages &&
      this.languages.includes((_language: Language) => _language.code === language.code)
    )
  }

  isInternational(): boolean {
    return this.broadcastAreaCodes.includes('r/INT')
  }

  isBroadcastInSubdivision(subdivision: Subdivision): boolean {
    if (this.isInternational()) return false

    return this.broadcastSubdivisionCodes.includes(subdivision.code)
  }

  isBroadcastInCountry(country: Country): boolean {
    if (this.isInternational()) return false

    return this.getBroadcastCountries().includes(
      (_country: Country) => _country.code === country.code
    )
  }

  isBroadcastInRegion(region: Region): boolean {
    if (this.isInternational()) return false

    return this.getBroadcastRegions().includes((_region: Region) => _region.code === region.code)
  }
}
