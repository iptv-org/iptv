import { LOGS_DIR, README_DIR } from '../constants'
import { Storage } from '@freearhey/storage-js'
import { LogParser, LogItem } from '../core'
import { Collection } from '@freearhey/core'
import * as sdk from '@iptv-org/sdk'
import { Table } from './table'
import { data } from '../api'

type ListItem = {
  name: string
  count: number
  link: string
}

export class RegionsTable implements Table {
  async create() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)
    const logRegions = parsed.filter((logItem: LogItem) => logItem.type === 'region')

    let items = new Collection<ListItem>()
    data.regions.forEach((region: sdk.Models.Region) => {
      const logItem = logRegions.find(
        (logItem: LogItem) => logItem.filepath === `regions/${region.code.toLowerCase()}.m3u`
      )

      if (!logItem) return

      items.add({
        name: region.name,
        count: logItem.count,
        link: `https://iptv-org.github.io/iptv/${logItem.filepath}`
      })
    })

    items = items.sortBy(item => item.name)

    const output = items
      .map(item => {
        return `- ${item.name} <code>${item.link}</code>`
      })
      .join('\r\n')

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_regions.md', output)
  }
}
