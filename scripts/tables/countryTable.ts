import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Country } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class CountryTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)

    const countriesContent = await dataStorage.json('countries.json')
    const countries = new Collection(countriesContent).map(data => new Country(data))
    const countriesGroupedByCode = countries.keyBy((country: Country) => country.code)

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)

    let data = new Collection()

    parsed
      .filter((logItem: LogItem) => logItem.type === 'country')
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const code = file.name().toUpperCase()
        const [countryCode] = code.split('-') || ['', '']
        const country = countriesGroupedByCode.get(countryCode)

        if (country) {
          data.add([
            country.name,
            `${country.flag} ${country.name}`,
            logItem.count,
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])
        } else {
          data.add([
            'ZZ',
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
      { name: 'Country' },
      { name: 'Channels', align: 'right' },
      { name: 'Playlist', nowrap: true }
    ])

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_countries.md', table.toString())
  }
}
