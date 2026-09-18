import { Collection } from '@freearhey/core'
import * as sdk from '@iptv-org/sdk'
import { Stream } from '../models'

export type PlaylistOptions = {
  public?: boolean
  raw?: boolean
}

export class Playlist {
  streams: Collection<Stream>
  options?: PlaylistOptions

  constructor(streams: Collection<Stream>, options?: PlaylistOptions) {
    this.streams = streams
    this.options = options
  }

  getGuides(): Collection<sdk.Models.Guide> {
    const guides = new Collection<sdk.Models.Guide>()

    this.streams.forEach(stream => {
      guides.concat(stream.getGuides())
    })

    return guides
  }

  getGuideUrls(): Collection<string> {
    function byFormat(source: sdk.Types.GuideSource) {
      if (source.format === 'GZIP') return 2
      if (source.format === 'XML') return 1
      return 0
    }

    const urls = new Collection<string>()

    this.getGuides().forEach((guide: sdk.Models.Guide) => {
      const sources = new Collection(guide.sources)

      const source = sources
        .filter((source: sdk.Types.GuideSource) => ['GZIP', 'XML'].includes(source.format))
        .sortBy([byFormat], ['desc'])
        .first()

      if (source) urls.add(source.url)
    })

    return urls.uniq()
  }

  toString() {
    let output = '#EXTM3U'

    const guideUrls = this.getGuideUrls()
    if (guideUrls.count()) {
      output += ` x-tvg-url="${guideUrls.join(',')}"`
    }

    output += '\r\n'

    this.streams.forEach((stream: Stream) => {
      output += stream.toString(this.options) + '\r\n'
    })

    return output
  }
}
