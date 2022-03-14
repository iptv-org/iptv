const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => stream.is_nsfw === false)

	await api.regions.load()
	let regions = await api.regions.all()
	regions = _.keyBy(regions, 'code')

	await api.countries.load()
	let countries = await api.countries.all()
	countries = _.keyBy(countries, 'code')

	await api.subdivisions.load()
	let subdivisions = await api.subdivisions.all()
	subdivisions = _.keyBy(subdivisions, 'code')

	let items = []
	streams.forEach(stream => {
		if (!stream.broadcast_area.length) {
			const item = _.cloneDeep(stream)
			item.group_title = 'Undefined'
			items.push(item)
			return
		}

		const broadcastCountries = getBroadcastCountries(stream, { countries, regions, subdivisions })
		broadcastCountries.forEach(country => {
			const item = _.cloneDeep(stream)
			item.group_title = country.name
			items.push(item)
		})
	})

	items = _.sortBy(items, item => {
		if (item.group_title === 'Undefined') return ''

		return item.group_title
	})

	return { filepath: 'index.country.m3u', items }
}

function getBroadcastCountries(stream, { countries, regions, subdivisions }) {
	let codes = stream.broadcast_area.reduce((acc, item) => {
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
				if (subdivisions[code]) {
					acc.push(subdivisions[code].country)
				}
				break
		}
		return acc
	}, [])

	codes = _.uniq(codes)

	return codes.map(code => countries[code]).filter(c => c)
}
