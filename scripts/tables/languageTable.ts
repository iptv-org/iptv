import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Language } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class LanguageTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)
    const languagesContent = await dataStorage.json('languages.json')
    const languages = new Collection(languagesContent).map(data => new Language(data))

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let data = new Collection()
    parser
      .parse(generatorsLog)
      .filter((logItem: LogItem) => logItem.filepath.includes('languages/'))
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const languageCode = file.name()
        const language: Language = languages.first(
          (language: Language) => language.code === languageCode
        )

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
