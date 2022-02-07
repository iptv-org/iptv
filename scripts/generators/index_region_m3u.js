const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => !stream.channel || stream.channel.is_nsfw === false)

	await api.regions.load()
	let regions = await api.regions.all()
	regions = _.keyBy(regions, 'code')

	let items = []
	streams.forEach(stream => {
		if (!stream.channel || !stream.channel.broadcast_area.length) {
			const item = _.cloneDeep(stream)
			item.group_title = null
			items.push(item)
			return
		}

		getChannelRegions(stream.channel, { regions }).forEach(region => {
			const item = _.cloneDeep(stream)
			item.group_title = region.name
			items.push(item)
		})
	})

	items = _.sortBy(items, i => {
		if (!i.group_title) return ''
		return i.group_title
	})

	return { filepath: 'index.region.m3u', items }
}

function getChannelRegions(channel, { regions }) {
	return channel.broadcast_area
		.reduce((acc, item) => {
			const [type, code] = item.split('/')
			switch (type) {
				case 'r':
					acc.push(regions[code])
					break
				case 's':
					const [c] = item.split('-')
					const r1 = _.filter(regions, { countries: [c] })
					acc = acc.concat(r1)
					break
				case 'c':
					const r2 = _.filter(regions, { countries: [code] })
					acc = acc.concat(r2)
					break
			}
			return acc
		}, [])
		.filter(i => i)
}
