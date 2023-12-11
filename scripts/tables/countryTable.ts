import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Country, Subdivision } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class CountryTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)

    const countriesContent = await dataStorage.json('countries.json')
    const countries = new Collection(countriesContent).map(data => new Country(data))

    const subdivisionsContent = await dataStorage.json('subdivisions.json')
    const subdivisions = new Collection(subdivisionsContent).map(data => new Subdivision(data))

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')

    let data = new Collection()
    parser
      .parse(generatorsLog)
      .filter(
        (logItem: LogItem) =>
          logItem.filepath.includes('countries/') || logItem.filepath.includes('subdivisions/')
      )
      .forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const code = file.name().toUpperCase()
        const [countryCode, subdivisionCode] = code.split('-') || ['', '']

        if (subdivisionCode) {
          const subdivision = subdivisions.first(
            (subdivision: Subdivision) => subdivision.code === code
          )
          const country = countries.first(
            (country: Country) => country.code === subdivision.country
          )
          data.add([
            `${country.name}/${subdivision.name}`,
            `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${subdivision.name}`,
            logItem.count,
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])
        } else if (countryCode === 'INT') {
          data.add([
            'ZZ',
            '🌍 International',
            logItem.count,
            `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
          ])
        } else {
          const country = countries.first((country: Country) => country.code === countryCode)
          data.add([
            country.name,
            `${country.flag} ${country.name}`,
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
