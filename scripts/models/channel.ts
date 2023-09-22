import { Collection } from '@freearhey/core'

type ChannelProps = {
  id: string
  name: string
  alt_names: string[]
  network: string
  owners: string[]
  country: string
  subdivision: string
  city: string
  broadcast_area: string[]
  languages: string[]
  categories: string[]
  is_nsfw: boolean
  launched: string
  closed: string
  replaced_by: string
  website: string
  logo: string
}

export class Channel {
  id: string
  name: string
  altNames: Collection
  network: string
  owners: Collection
  country: string
  subdivision: string
  city: string
  broadcastArea: Collection
  languages: Collection
  categories: Collection
  isNSFW: boolean
  launched: string
  closed: string
  replacedBy: string
  website: string
  logo: string

  constructor({
    id,
    name,
    alt_names,
    network,
    owners,
    country,
    subdivision,
    city,
    broadcast_area,
    languages,
    categories,
    is_nsfw,
    launched,
    closed,
    replaced_by,
    website,
    logo
  }: ChannelProps) {
    this.id = id
    this.name = name
    this.altNames = new Collection(alt_names)
    this.network = network
    this.owners = new Collection(owners)
    this.country = country
    this.subdivision = subdivision
    this.city = city
    this.broadcastArea = new Collection(broadcast_area)
    this.languages = new Collection(languages)
    this.categories = new Collection(categories)
    this.isNSFW = is_nsfw
    this.launched = launched
    this.closed = closed
    this.replacedBy = replaced_by
    this.website = website
    this.logo = logo
  }
}
