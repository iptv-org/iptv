import { HTMLTable, LogParser, LogItem, HTMLTableColumn, HTMLTableItem } from '../core'
import { Storage, File } from '@freearhey/storage-js'
import { LOGS_DIR, README_DIR } from '../constants'
import { Collection } from '@freearhey/core'
import * as sdk from '@iptv-org/sdk'
import { Table } from './table'
import { data } from '../api'

export class LanguagesTable implements Table {
  async create() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let items = new Collection<HTMLTableItem>()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.type === 'language')
      .forEach((logItem: LogItem) => {
        if (logItem.filepath.includes('undefined')) {
          items.add([
            'ZZ',
            'Undefined',
            logItem.count.toString(),
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])

          return
        }

        const file = new File(logItem.filepath)
        const languageCode = file.name()
        const language: sdk.Models.Language | undefined = data.languagesKeyByCode.get(languageCode)

        if (!language) return

        items.add([
          language.name,
          language.name,
          logItem.count.toString(),
          `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
        ])
      })

    items = items
      .sortBy(item => item[0])
      .map(item => {
        item.shift()
        return item
      })

    const columns = new Collection<HTMLTableColumn>([
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ])

    const table = new HTMLTable(items, columns)

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_languages.md', table.toString())
  }
}
