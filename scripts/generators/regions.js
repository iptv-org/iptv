const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	const output = []
	await api.regions.load()
	const regions = await api.regions.all()
	for (const region of regions) {
		const areaCodes = region.countries
		areaCodes.push(region.code)
		let items = _.filter(streams, s => _.intersection(areaCodes, s.broadcast_area).length)
		output.push({ id: region.code.toLowerCase(), items })
	}

	let items = _.filter(streams, s => !s.broadcast_area.length)
	output.push({ id: 'undefined', items })

	return output
}
