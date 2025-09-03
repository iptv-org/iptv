import { Collection, Dictionary } from '@freearhey/core'
import { City, Subdivision, Region, Country } from './'

export class BroadcastArea {
  codes: Collection
  citiesIncluded: Collection
  subdivisionsIncluded: Collection
  countriesIncluded: Collection
  regionsIncluded: Collection

  constructor(codes: Collection) {
    this.codes = codes
  }

  withLocations(
    citiesKeyByCode: Dictionary,
    subdivisionsKeyByCode: Dictionary,
    countriesKeyByCode: Dictionary,
    regionsKeyByCode: Dictionary
  ): this {
    const citiesIncluded = new Collection()
    const subdivisionsIncluded = new Collection()
    const countriesIncluded = new Collection()
    let regionsIncluded = new Collection()

    this.codes.forEach((value: string) => {
      const [type, code] = value.split('/')

      switch (type) {
        case 'ct': {
          const city: City = citiesKeyByCode.get(code)
          if (!city) return
          citiesIncluded.add(city)
          if (city.subdivision) subdivisionsIncluded.add(city.subdivision)
          if (city.subdivision && city.subdivision.parent)
            subdivisionsIncluded.add(city.subdivision.parent)
          if (city.country) countriesIncluded.add(city.country)
          regionsIncluded = regionsIncluded.concat(city.getRegions())
          break
        }
        case 's': {
          const subdivision: Subdivision = subdivisionsKeyByCode.get(code)
          if (!subdivision) return
          subdivisionsIncluded.add(subdivision)
          if (subdivision.country) countriesIncluded.add(subdivision.country)
          regionsIncluded = regionsIncluded.concat(subdivision.getRegions())
          break
        }
        case 'c': {
          const country: Country = countriesKeyByCode.get(code)
          if (!country) return
          countriesIncluded.add(country)
          regionsIncluded = regionsIncluded.concat(country.getRegions())
          break
        }
        case 'r': {
          const region: Region = regionsKeyByCode.get(code)
          if (!region) return
          regionsIncluded = regionsIncluded.concat(region.getRegions())
          break
        }
      }
    })

    this.citiesIncluded = citiesIncluded.uniqBy((city: City) => city.code)
    this.subdivisionsIncluded = subdivisionsIncluded.uniqBy(
      (subdivision: Subdivision) => subdivision.code
    )
    this.countriesIncluded = countriesIncluded.uniqBy((country: Country) => country.code)
    this.regionsIncluded = regionsIncluded.uniqBy((region: Region) => region.code)

    return this
  }

  getCountries(): Collection {
    return this.countriesIncluded || new Collection()
  }

  getSubdivisions(): Collection {
    return this.subdivisionsIncluded || new Collection()
  }

  getCities(): Collection {
    return this.citiesIncluded || new Collection()
  }

  getRegions(): Collection {
    return this.regionsIncluded || new Collection()
  }

  includesCountry(country: Country): boolean {
    return this.getCountries().includes((_country: Country) => _country.code === country.code)
  }

  includesSubdivision(subdivision: Subdivision): boolean {
    return this.getSubdivisions().includes(
      (_subdivision: Subdivision) => _subdivision.code === subdivision.code
    )
  }

  includesRegion(region: Region): boolean {
    return this.getRegions().includes((_region: Region) => _region.code === region.code)
  }

  includesCity(city: City): boolean {
    return this.getCities().includes((_city: City) => _city.code === city.code)
  }
}
