import { Storage, Collection, Dictionary } from '@freearhey/core'
import { City, Country, Subdivision } from '../models'
import { LOGS_DIR, README_DIR } from '../constants'
import { LogParser, LogItem } from '../core'
import { Table } from './table'

type CountriesTableProps = {
  countriesKeyByCode: Dictionary
  subdivisionsKeyByCode: Dictionary
  countries: Collection
  subdivisions: Collection
  cities: Collection
}

export class CountriesTable implements Table {
  countriesKeyByCode: Dictionary
  subdivisionsKeyByCode: Dictionary
  countries: Collection
  subdivisions: Collection
  cities: Collection

  constructor({
    countriesKeyByCode,
    subdivisionsKeyByCode,
    countries,
    subdivisions,
    cities
  }: CountriesTableProps) {
    this.countriesKeyByCode = countriesKeyByCode
    this.subdivisionsKeyByCode = subdivisionsKeyByCode
    this.countries = countries
    this.subdivisions = subdivisions
    this.cities = cities
  }

  async make() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)
    const logCountries = parsed.filter((logItem: LogItem) => logItem.type === 'country')
    const logSubdivisions = parsed.filter((logItem: LogItem) => logItem.type === 'subdivision')
    const logCities = parsed.filter((logItem: LogItem) => logItem.type === 'city')

    let items = new Collection()
    this.countries.forEach((country: Country) => {
      const countriesLogItem = logCountries.find(
        (logItem: LogItem) => logItem.filepath === `countries/${country.code.toLowerCase()}.m3u`
      )

      const countryItem = {
        index: country.name,
        count: 0,
        link: `https://iptv-org.github.io/iptv/countries/${country.code.toLowerCase()}.m3u`,
        name: `${country.flag} ${country.name}`,
        children: new Collection()
      }

      if (countriesLogItem) {
        countryItem.count = countriesLogItem.count
      }

      const countrySubdivisions = this.subdivisions.filter(
        (subdivision: Subdivision) => subdivision.countryCode === country.code
      )
      const countryCities = this.cities.filter((city: City) => city.countryCode === country.code)
      if (countrySubdivisions.notEmpty()) {
        this.subdivisions.forEach((subdivision: Subdivision) => {
          if (subdivision.countryCode !== country.code) return
          const subdivisionCities = countryCities.filter(
            (city: City) =>
              (city.subdivisionCode && city.subdivisionCode === subdivision.code) ||
              city.countryCode === subdivision.countryCode
          )
          const subdivisionsLogItem = logSubdivisions.find(
            (logItem: LogItem) =>
              logItem.filepath === `subdivisions/${subdivision.code.toLowerCase()}.m3u`
          )

          const subdivisionItem = {
            index: subdivision.name,
            name: subdivision.name,
            count: 0,
            link: `https://iptv-org.github.io/iptv/subdivisions/${subdivision.code.toLowerCase()}.m3u`,
            children: new Collection()
          }

          if (subdivisionsLogItem) {
            subdivisionItem.count = subdivisionsLogItem.count
          }

          subdivisionCities.forEach((city: City) => {
            if (city.countryCode !== country.code || city.subdivisionCode !== subdivision.code)
              return
            const citiesLogItem = logCities.find(
              (logItem: LogItem) => logItem.filepath === `cities/${city.code.toLowerCase()}.m3u`
            )

            if (!citiesLogItem) return

            subdivisionItem.children.add({
              index: city.name,
              name: city.name,
              count: citiesLogItem.count,
              link: `https://iptv-org.github.io/iptv/${citiesLogItem.filepath}`
            })
          })

          if (subdivisionItem.count > 0 || subdivisionItem.children.notEmpty()) {
            countryItem.children.add(subdivisionItem)
          }
        })
      } else if (countryCities.notEmpty()) {
        countryCities.forEach((city: City) => {
          const citiesLogItem = logCities.find(
            (logItem: LogItem) => logItem.filepath === `cities/${city.code.toLowerCase()}.m3u`
          )

          if (!citiesLogItem) return

          countryItem.children.add({
            index: city.name,
            name: city.name,
            count: citiesLogItem.count,
            link: `https://iptv-org.github.io/iptv/${citiesLogItem.filepath}`,
            children: new Collection()
          })
        })
      }

      if (countryItem.count > 0 || countryItem.children.notEmpty()) {
        items.add(countryItem)
      }
    })

    const internationalLogItem = logCountries.find(
      (logItem: LogItem) => logItem.filepath === 'countries/int.m3u'
    )

    if (internationalLogItem) {
      items.push({
        index: 'ZZ',
        name: '🌐 International',
        count: internationalLogItem.count,
        link: `https://iptv-org.github.io/iptv/${internationalLogItem.filepath}`,
        children: new Collection()
      })
    }

    const undefinedLogItem = logCountries.find(
      (logItem: LogItem) => logItem.filepath === 'countries/undefined.m3u'
    )

    if (undefinedLogItem) {
      items.push({
        index: 'ZZZ',
        name: 'Undefined',
        count: undefinedLogItem.count,
        link: `https://iptv-org.github.io/iptv/${undefinedLogItem.filepath}`,
        children: new Collection()
      })
    }

    items = items.orderBy(item => item.index)

    const output = items
      .map(item => {
        let row = `- ${item.name} <code>${item.link}</code>`

        item.children
          .orderBy(item => item.index)
          .forEach(item => {
            row += `\r\n  - ${item.name} <code>${item.link}</code>`

            item.children
              .orderBy(item => item.index)
              .forEach(item => {
                row += `\r\n    - ${item.name} <code>${item.link}</code>`
              })
          })

        return row
      })
      .join('\r\n')

    const readmeStorage = new Storage(README_DIR)
    await readmeStorage.save('_countries.md', output)
  }
}
