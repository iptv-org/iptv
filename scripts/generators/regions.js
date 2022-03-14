const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => stream.is_nsfw === false)

	await api.regions.load()
	const regions = await api.regions.all()

	await api.subdivisions.load()
	const subdivisions = await api.subdivisions.all()

	const output = []
	for (const region of regions) {
		const regionCountries = region.countries
		let areaCodes = regionCountries.map(code => `c/${code}`)

		const regionSubdivisions = _.filter(
			subdivisions,
			s => regionCountries.indexOf(s.country) > -1
		).map(s => `s/${s.code}`)
		areaCodes = areaCodes.concat(regionSubdivisions)

		areaCodes.push(`r/${region.code}`)

		let items = _.filter(streams, stream => _.intersection(stream.broadcast_area, areaCodes).length)
		output.push({ filepath: `regions/${region.code.toLowerCase()}.m3u`, items })
	}

	let items = _.filter(streams, stream => !stream.broadcast_area.length)
	output.push({ filepath: 'regions/undefined.m3u', items })

	return output
}
