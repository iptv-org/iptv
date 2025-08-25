import { Storage, Collection, File, Dictionary } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { LOGS_DIR, README_DIR } from '../constants'
import { Language } from '../models'
import { Table } from './table'

type LanguagesTableProps = {
  languagesKeyByCode: Dictionary
}

export class LanguagesTable implements Table {
  languagesKeyByCode: Dictionary

  constructor({ languagesKeyByCode }: LanguagesTableProps) {
    this.languagesKeyByCode = languagesKeyByCode
  }

  async make() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let data = new Collection()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.type === 'language')
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const languageCode = file.name()
        const language: Language = this.languagesKeyByCode.get(languageCode)

        data.add([
          language ? language.name : 'ZZ',
          language ? language.name : 'Undefined',
          logItem.count,
          `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
        ])
      })

    data = data
      .orderBy(item => item[0])
      .map(item => {
        item.shift()
        return item
      })

    const table = new HTMLTable(data.all(), [
      { name: 'Language', align: 'left' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', align: 'left', nowrap: true }
    ])

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_languages.md', table.toString())
  }
}
