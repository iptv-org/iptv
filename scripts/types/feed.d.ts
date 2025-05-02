import { Collection } from '@freearhey/core'

export type FeedData = {
  channel: string
  id: string
  name: string
  is_main: boolean
  broadcast_area: Collection
  languages: Collection
  timezones: Collection
  video_format: string
}
