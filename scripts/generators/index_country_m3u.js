const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)

	await api.regions.load()
	let regions = await api.regions.all()
	regions = _.keyBy(regions, 'code')

	await api.countries.load()
	let countries = await api.countries.all()
	countries = _.keyBy(countries, 'code')

	let items = []
	streams.forEach(stream => {
		if (!stream.channel || !stream.channel.broadcast_area.length) {
			const item = _.cloneDeep(stream)
			item.group_title = null
			items.push(item)
			return
		}

		getBroadcastCountries(stream.channel, { countries, regions }).forEach(country => {
			const item = _.cloneDeep(stream)
			item.group_title = country.name
			items.push(item)
		})
	})

	items = _.sortBy(items, item => {
		if (!item.group_title) return false
		return item.group_title
	})

	return { filepath: 'index.country.m3u', items }
}

function getBroadcastCountries(channel, { countries, regions }) {
	let codes = channel.broadcast_area.reduce((acc, item) => {
		const [type, code] = item.split('/')
		switch (type) {
			case 'c':
				acc.push(code)
				break
			case 'r':
				if (regions[code]) {
					acc = acc.concat(regions[code].countries)
				}
				break
			case 's':
				const [c] = item.split('-')
				acc.push(c)
				break
		}
		return acc
	}, [])

	codes = _.uniq(codes)

	return codes.map(code => countries[code]).filter(c => c)
}
