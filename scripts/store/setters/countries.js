const dataRegions = require('../../data/regions')
const dataCountries = require('../../data/countries')

module.exports = function ({ tvg_country, countries = [] }) {
  if (tvg_country) {
    return tvg_country
      .split(';')
      .reduce((acc, curr) => {
        const region = dataRegions[curr]
        if (region) {
          for (let code of region.country_codes) {
            if (!acc.includes(code)) acc.push(code)
          }
        } else {
          acc.push(curr)
        }

        return acc
      }, [])
      .map(item => dataCountries[item])
      .filter(i => i)
  }

  return countries
}
