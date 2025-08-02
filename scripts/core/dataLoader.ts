import { ApiClient } from './apiClient'
import { Storage } from '@freearhey/core'
import cliProgress, { MultiBar } from 'cli-progress'
import type { DataLoaderProps, DataLoaderData } from '../types/dataLoader'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

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
        const speed = payload.speed ? formatBytes(payload.speed) + '/s' : 'N/A'
        const total = formatBytes(params.total)
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
      logos,
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
      this.storage.json('logos.json'),
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
      logos,
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
