const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
  streams = _.filter(streams, stream => stream.is_nsfw === false)

  await api.countries.load()
  const countries = await api.countries.all()
  await api.regions.load()
  let regions = await api.regions.all()
  regions = regions.filter(r => r.code !== 'INT')
  await api.subdivisions.load()
  const subdivisions = await api.subdivisions.all()

  let output = []
  for (const country of countries) {
    let countryRegionCodes = _.filter(regions, { countries: [country.code] }).map(
      r => `r/${r.code}`
    )
    const countrySubdivisions = _.filter(subdivisions, { country: country.code })
    const countryAreaCodes = countryRegionCodes.concat(countrySubdivisions.map(s => `s/${s.code}`))
    countryAreaCodes.push(`c/${country.code}`)

    let items = _.filter(streams, stream => {
      return _.intersection(stream.broadcast_area, countryAreaCodes).length
    })

    output.push({ filepath: `countries/${country.code.toLowerCase()}.m3u`, items })

    for (let subdivision of countrySubdivisions) {
      let subdivisionItems = _.filter(streams, stream => {
        return stream.broadcast_area.includes(`s/${subdivision.code}`)
      })

      if (subdivisionItems.length) {
        output.push({
          filepath: `subdivisions/${subdivision.code.toLowerCase()}.m3u`,
          items: subdivisionItems
        })
      }
    }
  }

  let intItems = _.filter(streams, stream => stream.broadcast_area.includes('r/INT'))
  output.push({
    filepath: `countries/int.m3u`,
    items: intItems
  })

  output = output.filter(f => f.items.length > 0)

  return output
}
