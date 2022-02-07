const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)
	let items = []
	streams.forEach(stream => {
		if (!stream.regions.length) return items.push(stream)

		stream.regions.forEach(region => {
			const item = _.cloneDeep(stream)
			item.group_title = region.name
			items.push(item)
		})
	})
	items = _.sortBy(items, i => {
		if (i.group_title === 'Undefined') return '_'
		return i.group_title
	})

	return { filepath: 'index.region.m3u', items }
}
