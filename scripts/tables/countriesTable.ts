import { LOGS_DIR, README_DIR } from '../constants'
import { Storage } from '@freearhey/storage-js'
import { Collection } from '@freearhey/core'
import { LogParser, LogItem } from '../core'
import * as sdk from '@iptv-org/sdk'
import { Table } from './table'
import { data } from '../api'

type ListItem = {
  index: string
  count: number
  link: string
  name: string
  children: Collection<ListItem>
}

export class CountriesTable implements Table {
  async create() {
    const parser = new LogParser()
    const logsStorage = new Storage(LOGS_DIR)
    const generatorsLog = await logsStorage.load('generators.log')
    const parsed = parser.parse(generatorsLog)
    const logCountries = parsed.filter((logItem: LogItem) => logItem.type === 'country')
    const logSubdivisions = parsed.filter((logItem: LogItem) => logItem.type === 'subdivision')
    const logCities = parsed.filter((logItem: LogItem) => logItem.type === 'city')

    let items = new Collection()
    data.countries.forEach((country: sdk.Models.Country) => {
      const countryCode = country.code
      const countriesLogItem = logCountries.find(
        (logItem: LogItem) => logItem.filepath === `countries/${countryCode.toLowerCase()}.m3u`
      )

      const countryItem: ListItem = {
        index: country.name,
        count: 0,
        link: `https://iptv-org.github.io/iptv/countries/${countryCode.toLowerCase()}.m3u`,
        name: `${country.flag} ${country.name}`,
        children: new Collection()
      }

      if (countriesLogItem) {
        countryItem.count = countriesLogItem.count
      }

      const countrySubdivisions = data.subdivisions.filter(
        (subdivision: sdk.Models.Subdivision) => subdivision.country === countryCode
      )
      const countryCities = data.cities.filter(
        (city: sdk.Models.City) => city.country === countryCode
      )
      if (countrySubdivisions.isNotEmpty()) {
        data.subdivisions.forEach((subdivision: sdk.Models.Subdivision) => {
          if (subdivision.country !== countryCode) return

          const subdivisionCode = subdivision.code
          const subdivisionCities = countryCities.filter(
            (city: sdk.Models.City) =>
              (city.subdivision && city.subdivision === subdivisionCode) ||
              city.country === subdivision.country
          )
          const subdivisionsLogItem = logSubdivisions.find(
            (logItem: LogItem) =>
              logItem.filepath === `subdivisions/${subdivisionCode.toLowerCase()}.m3u`
          )

          const subdivisionItem: ListItem = {
            index: subdivision.name,
            name: subdivision.name,
            count: 0,
            link: `https://iptv-org.github.io/iptv/subdivisions/${subdivisionCode.toLowerCase()}.m3u`,
            children: new Collection<ListItem>()
          }

          if (subdivisionsLogItem) {
            subdivisionItem.count = subdivisionsLogItem.count
          }

          subdivisionCities.forEach((city: sdk.Models.City) => {
            if (city.country !== countryCode || city.subdivision !== subdivisionCode) return
            const citiesLogItem = logCities.find(
              (logItem: LogItem) => logItem.filepath === `cities/${city.code.toLowerCase()}.m3u`
            )

            if (!citiesLogItem) return

            subdivisionItem.children.add({
              index: city.name,
              name: city.name,
              count: citiesLogItem.count,
              link: `https://iptv-org.github.io/iptv/${citiesLogItem.filepath}`,
              children: new Collection<ListItem>()
            })
          })

          if (subdivisionItem.count > 0 || subdivisionItem.children.isNotEmpty()) {
            countryItem.children.add(subdivisionItem)
          }
        })
      } else if (countryCities.isNotEmpty()) {
        countryCities.forEach((city: sdk.Models.City) => {
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

      if (countryItem.count > 0 || countryItem.children.isNotEmpty()) {
        items.add(countryItem)
      }
    })

    const internationalLogItem = logCountries.find(
      (logItem: LogItem) => logItem.filepath === 'countries/int.m3u'
    )

    if (internationalLogItem) {
      items.add({
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
      items.add({
        index: 'ZZZ',
        name: 'Undefined',
        count: undefinedLogItem.count,
        link: `https://iptv-org.github.io/iptv/${undefinedLogItem.filepath}`,
        children: new Collection()
      })
    }

    items = items.sortBy(item => item.index)

    const output = items
      .map((item: ListItem) => {
        let row = `- ${item.name} <code>${item.link}</code>`

        item.children
          .sortBy((item: ListItem) => item.index)
          .forEach((item: ListItem) => {
            row += `\r\n  - ${item.name} <code>${item.link}</code>`

            item.children
              .sortBy((item: ListItem) => item.index)
              .forEach((item: ListItem) => {
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
