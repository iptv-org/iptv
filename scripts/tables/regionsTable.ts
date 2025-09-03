import { Storage, Collection } from '@freearhey/core'
import { LogParser, LogItem } from '../core'
import { LOGS_DIR, README_DIR } from '../constants'
import { Region } from '../models'
import { Table } from './table'

type RegionsTableProps = {
  regions: Collection
}

export class RegionsTable implements Table {
  regions: Collection

  constructor({ regions }: RegionsTableProps) {
    this.regions = regions
  }

  async make() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)
    const logRegions = parsed.filter((logItem: LogItem) => logItem.type === 'region')

    let items = new Collection()
    this.regions.forEach((region: Region) => {
      const logItem = logRegions.find(
        (logItem: LogItem) => logItem.filepath === `regions/${region.code.toLowerCase()}.m3u`
      )

      if (!logItem) return

      items.add({
        index: region.name,
        name: region.name,
        count: logItem.count,
        link: `https://iptv-org.github.io/iptv/${logItem.filepath}`
      })
    })

    items = items.orderBy(item => item.index)

    const output = items
      .map(item => {
        return `- ${item.name} <code>${item.link}</code>`
      })
      .join('\r\n')

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_regions.md', output)
  }
}
