const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => stream.is_nsfw === false)

	await api.countries.load()
	const countries = await api.countries.all()
	await api.regions.load()
	const regions = await api.regions.all()
	await api.subdivisions.load()
	const subdivisions = await api.subdivisions.all()

	const output = []
	for (const country of countries) {
		let countryRegionCodes = _.filter(regions, { countries: [country.code] }).map(
			r => `r/${r.code}`
		)
		const countrySubdivisionCodes = _.filter(subdivisions, { country: country.code}).map(
			r => `s/${r.code}`
		)
		const countryAreaCodes = countryRegionCodes.concat(countrySubdivisionCodes)
		countryAreaCodes.push(`c/${country.code}`)

		let items = _.filter(streams, stream => {
			return _.intersection(stream.broadcast_area, countryAreaCodes).length
		})

		output.push({ filepath: `countries/${country.code.toLowerCase()}.m3u`, items })
	}

	let items = _.filter(streams, stream => !stream.broadcast_area.length)
	output.push({ filepath: 'countries/undefined.m3u', items })

	return output
}
