const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	const output = []
	await api.countries.load()
	const countries = await api.countries.all()
	await api.regions.load()
	const regions = await api.regions.all()
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)
	for (const country of countries) {
		const areaCodes = _.filter(regions, { countries: [country.code] }).map(r => r.code)
		areaCodes.push(country.code)
		let items = _.filter(streams, s => _.intersection(areaCodes, s.broadcast_area).length)
		output.push({ filepath: `countries/${country.code.toLowerCase()}.m3u`, items })
	}

	let items = _.filter(streams, s => !s.broadcast_area.length)
	output.push({ filepath: 'countries/undefined.m3u', items })

	return output
}
