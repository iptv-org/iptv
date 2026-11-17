import { Collection } from '@freearhey/core'
import { Stream } from '../models'

// Keep internal playlists in the same order as playlist:format without
// performing its URL normalization, deduplication or network probing.
export function sortStreams(streams: Collection<Stream>): Collection<Stream> {
  return streams.sortBy(
    [
      (stream: Stream) => stream.title,
      (stream: Stream) => (stream.isGeoBlocked ? -1 : 0),
      (stream: Stream) => (stream.isNot247 ? -1 : 0),
      (stream: Stream) => stream.getVerticalResolution(),
      (stream: Stream) => stream.url
    ],
    ['asc', 'desc', 'desc', 'desc', 'asc']
  )
}
