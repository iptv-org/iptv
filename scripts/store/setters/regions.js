const _ = require('lodash')

let regions = require('../../data/regions')

module.exports = function ({ countries }) {
  if (!countries.length) return []

  const output = []
  regions = Object.values(regions)
  countries.forEach(country => {
    regions
      .filter(region => region.country_codes.includes(country.code))
      .forEach(found => {
        output.push({
          name: found.name,
          code: found.code
        })
      })
  })

  return _.uniqBy(output, 'code')
}
