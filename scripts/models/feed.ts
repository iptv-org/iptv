import { Country, Language, Region, Channel, Subdivision } from './index'
import { Collection, Dictionary } from '@freearhey/core'
import type { FeedData } from '../types/feed'

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
  guides?: Collection
  streams?: Collection

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

  withChannel(channelsKeyById: Dictionary): this {
    this.channel = channelsKeyById.get(this.channelId)

    return this
  }

  withStreams(streamsGroupedById: Dictionary): this {
    this.streams = new Collection(streamsGroupedById.get(`${this.channelId}@${this.id}`))

    if (this.isMain) {
      this.streams = this.streams.concat(new Collection(streamsGroupedById.get(this.channelId)))
    }

    return this
  }

  withGuides(guidesGroupedByStreamId: Dictionary): this {
    this.guides = new Collection(guidesGroupedByStreamId.get(`${this.channelId}@${this.id}`))

    if (this.isMain) {
      this.guides = this.guides.concat(new Collection(guidesGroupedByStreamId.get(this.channelId)))
    }

    return this
  }

  withLanguages(languagesKeyByCode: Dictionary): this {
    this.languages = this.languageCodes
      .map((code: string) => languagesKeyByCode.get(code))
      .filter(Boolean)

    return this
  }

  withTimezones(timezonesKeyById: Dictionary): this {
    this.timezones = this.timezoneIds.map((id: string) => timezonesKeyById.get(id)).filter(Boolean)

    return this
  }

  withBroadcastSubdivisions(subdivisionsKeyByCode: Dictionary): this {
    this.broadcastSubdivisions = this.broadcastSubdivisionCodes.map((code: string) =>
      subdivisionsKeyByCode.get(code)
    )

    return this
  }

  withBroadcastCountries(
    countriesKeyByCode: Dictionary,
    regionsKeyByCode: Dictionary,
    subdivisionsKeyByCode: Dictionary
  ): this {
    const broadcastCountries = new Collection()

    if (this.isInternational()) {
      this.broadcastCountries = broadcastCountries
      return this
    }

    this.broadcastCountryCodes.forEach((code: string) => {
      broadcastCountries.add(countriesKeyByCode.get(code))
    })

    this.broadcastRegionCodes.forEach((code: string) => {
      const region: Region = regionsKeyByCode.get(code)
      if (region) {
        region.countryCodes.forEach((countryCode: string) => {
          broadcastCountries.add(countriesKeyByCode.get(countryCode))
        })
      }
    })

    this.broadcastSubdivisionCodes.forEach((code: string) => {
      const subdivision: Subdivision = subdivisionsKeyByCode.get(code)
      if (subdivision) {
        broadcastCountries.add(countriesKeyByCode.get(subdivision.countryCode))
      }
    })

    this.broadcastCountries = broadcastCountries.uniq().filter(Boolean)

    return this
  }

  withBroadcastRegions(regions: Collection): this {
    if (!this.broadcastCountries) return this
    const countriesCodes = this.broadcastCountries.map((country: Country) => country.code)

    this.broadcastRegions = regions.filter((region: Region) => {
      if (region.code === 'INT') return false
      const intersected = region.countryCodes.intersects(countriesCodes)
      return intersected.notEmpty()
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
    if (this.broadcastSubdivisionCodes.includes(subdivision.code)) return true
    if (
      this.broadcastSubdivisionCodes.isEmpty() &&
      subdivision.country &&
      this.isBroadcastInCountry(subdivision.country)
    )
      return true

    return false
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

  getGuides(): Collection {
    if (!this.guides) return new Collection()

    return this.guides
  }

  getStreams(): Collection {
    if (!this.streams) return new Collection()

    return this.streams
  }

  getFullName(): string {
    if (!this.channel) return ''

    return `${this.channel.name} ${this.name}`
  }
}
