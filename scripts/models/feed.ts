import { Country, Language, Region, Channel, Subdivision, BroadcastArea, City } from './index'
import { Collection, Dictionary } from '@freearhey/core'
import type { FeedData } from '../types/feed'

export class Feed {
  channelId: string
  channel?: Channel
  id: string
  name: string
  isMain: boolean
  broadcastAreaCodes: Collection
  broadcastArea?: BroadcastArea
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

  withBroadcastArea(
    citiesKeyByCode: Dictionary,
    subdivisionsKeyByCode: Dictionary,
    countriesKeyByCode: Dictionary,
    regionsKeyByCode: Dictionary
  ): this {
    this.broadcastArea = new BroadcastArea(this.broadcastAreaCodes).withLocations(
      citiesKeyByCode,
      subdivisionsKeyByCode,
      countriesKeyByCode,
      regionsKeyByCode
    )

    return this
  }

  hasBroadcastArea(): boolean {
    return !!this.broadcastArea
  }

  getBroadcastCountries(): Collection {
    if (!this.broadcastArea) return new Collection()

    return this.broadcastArea.getCountries()
  }

  getBroadcastRegions(): Collection {
    if (!this.broadcastArea) return new Collection()

    return this.broadcastArea.getRegions()
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

  isBroadcastInCity(city: City): boolean {
    if (!this.broadcastArea) return false

    return this.broadcastArea.includesCity(city)
  }

  isBroadcastInSubdivision(subdivision: Subdivision): boolean {
    if (!this.broadcastArea) return false

    return this.broadcastArea.includesSubdivision(subdivision)
  }

  isBroadcastInCountry(country: Country): boolean {
    if (!this.broadcastArea) return false

    return this.broadcastArea.includesCountry(country)
  }

  isBroadcastInRegion(region: Region): boolean {
    if (!this.broadcastArea) return false

    return this.broadcastArea.includesRegion(region)
  }

  isInternational(): boolean {
    if (!this.broadcastArea) return false

    return this.broadcastArea.codes.join(',').includes('r/')
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
