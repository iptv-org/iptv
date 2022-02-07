const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	const output = []
	await api.regions.load()
	const regions = await api.regions.all()
	streams = _.filter(streams, stream => !stream.channel || stream.channel.is_nsfw === false)
	for (const region of regions) {
		const areaCodes = region.countries.map(code => `c/${code}`)
		areaCodes.push(`r/${region.code}`)
		let items = _.filter(
			streams,
			stream => stream.channel && _.intersection(stream.channel.broadcast_area, areaCodes).length
		)
		output.push({ filepath: `regions/${region.code.toLowerCase()}.m3u`, items })
	}

	let items = _.filter(streams, stream => !stream.channel || !stream.channel.broadcast_area.length)
	output.push({ filepath: 'regions/undefined.m3u', items })

	return output
}
