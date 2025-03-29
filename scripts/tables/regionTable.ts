import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Region } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class RegionTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)
    const regionsContent = await dataStorage.json('regions.json')
    const regions = new Collection(regionsContent).map(data => new Region(data))
    const regionsGroupedByCode = regions.keyBy((region: Region) => region.code)

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let data = new Collection()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.type === 'region')
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const regionCode = file.name().toUpperCase()
        const region: Region = regionsGroupedByCode.get(regionCode)

        if (region) {
          data.add([
            region.name,
            region.name,
            logItem.count,
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])
        } else {
          data.add([
            'ZZZ',
            'Undefined',
            logItem.count,
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])
        }
      })

    data = data
      .orderBy(item => item[0])
      .map(item => {
        item.shift()
        return item
      })

    const table = new HTMLTable(data.all(), [
      { name: 'Region', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ])

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_regions.md', table.toString())
  }
}
