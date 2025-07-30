import { Storage, Collection, File } from '@freearhey/core'
import { HTMLTable, LogParser, LogItem } from '../core'
import { Country, Subdivision } from '../models'
import { DATA_DIR, LOGS_DIR, README_DIR } from '../constants'
import { Table } from './table'

export class SubdivisionTable implements Table {
  constructor() {}

  async make() {
    const dataStorage = new Storage(DATA_DIR)

    const countriesContent = await dataStorage.json('countries.json')
    const countries = new Collection(countriesContent).map(data => new Country(data))
    const countriesGroupedByCode = countries.keyBy((country: Country) => country.code)
    const subdivisionsContent = await dataStorage.json('subdivisions.json')
    const subdivisions = new Collection(subdivisionsContent).map(data => new Subdivision(data))
    const subdivisionsGroupedByCode = subdivisions.keyBy(
      (subdivision: Subdivision) => subdivision.code
    )

    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)
    const parsedSubdivisions = parsed.filter((logItem: LogItem) => logItem.type === 'subdivision')

    let output = ''
    countries.forEach((country: Country) => {
      const parsedCountrySubdivisions = parsedSubdivisions.filter((logItem: LogItem) =>
        logItem.filepath.includes(`subdivisions/${country.code.toLowerCase()}`)
      )

      if (!parsedCountrySubdivisions.length) return

      output += `\r\n<details>\r\n<summary>${country.name}</summary>\r\n`

      const data = new Collection()

      parsedCountrySubdivisions.forEach((logItem: LogItem) => {
        const file = new File(logItem.filepath)
        const code = file.name().toUpperCase()
        const [countryCode, subdivisionCode] = code.split('-') || ['', '']
        const country = countriesGroupedByCode.get(countryCode)

        if (country && subdivisionCode) {
          const subdivision = subdivisionsGroupedByCode.get(code)
          if (subdivision) {
            data.add([
              subdivision.name,
              logItem.count,
              `<code>https://iptv-org.github.io/iptv/${logItem.filepath}</code>`
            ])
          }
        }
      })

      const table = new HTMLTable(data.all(), [
        { name: 'Subdivision' },
        { name: 'Channels', align: 'right' },
        { name: 'Playlist', nowrap: true }
      ])

      output += table.toString()

      output += '\r\n</details>'
    })

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_subdivisions.md', output.trim())
  }
}
