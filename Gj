import { ApiClient } from './apiClient'
import { Storage } from '@freearhey/core'
import cliProgress, { MultiBar } from 'cli-progress'
import numeral from 'numeral'
import type { DataLoaderProps, DataLoaderData } from '../types/dataLoader'

export class DataLoader {
  client: ApiClient
  storage: Storage
  progressBar: MultiBar

  constructor(props: DataLoaderProps) {
    this.client = new ApiClient()
    this.storage = props.storage
    this.progressBar = new cliProgress.MultiBar({
      stopOnComplete: true,
      hideCursor: true,
      forceRedraw: true,
      barsize: 36,
      format(options, params, payload) {
        const filename = payload.filename.padEnd(18, ' ')
        const barsize = options.barsize || 40
        const percent = (params.progress * 100).toFixed(2)
        const speed = payload.speed ? numeral(payload.speed).format('0.0 b') + '/s' : 'N/A'
        const total = numeral(params.total).format('0.0 b')
        const completeSize = Math.round(params.progress * barsize)
        const incompleteSize = barsize - completeSize
        const bar =
          options.barCompleteString && options.barIncompleteString
            ? options.barCompleteString.substr(0, completeSize) +
              options.barGlue +
              options.barIncompleteString.substr(0, incompleteSize)
            : '-'.repeat(barsize)

        return `${filename} [${bar}] ${percent}% | ETA: ${params.eta}s | ${total} | ${speed}`
      }
    })
  }

  async load(): Promise<DataLoaderData> {
    const [
      countries,
      regions,
      subdivisions,
      languages,
      categories,
      blocklist,
      channels,
      feeds,
      timezones,
      guides,
      streams
    ] = await Promise.all([
      this.storage.json('countries.json'),
      this.storage.json('regions.json'),
      this.storage.json('subdivisions.json'),
      this.storage.json('languages.json'),
      this.storage.json('categories.json'),
      this.storage.json('blocklist.json'),
      this.storage.json('channels.json'),
      this.storage.json('feeds.json'),
      this.storage.json('timezones.json'),
      this.storage.json('guides.json'),
      this.storage.json('streams.json')
    ])

    return {
      countries,
      regions,
      subdivisions,
      languages,
      categories,
      blocklist,
      channels,
      feeds,
      timezones,
      guides,
      streams
    }
  }

  async download(filename: string) {
    if (!this.storage || !this.progressBar) return

    const stream = await this.storage.createStream(filename)
    const progressBar = this.progressBar.create(0, 0, { filename })

    this.client
      .get(filename, {
        responseType: 'stream',
        onDownloadProgress({ total, loaded, rate }) {
          if (total) progressBar.setTotal(total)
          progressBar.update(loaded, { speed: rate })
        }
      })
      .then(response => {
        response.data.pipe(stream)
      })
  }
}
