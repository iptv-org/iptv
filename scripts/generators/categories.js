const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.orderBy(
		streams,
		['channel.name', 'status.level', 'resolution.height'],
		['asc', 'asc', 'desc']
	)
	streams = _.uniqBy(streams, s => s.channel_id || _.uniqueId())
	const output = []
	await api.categories.load()
	const categories = await api.categories.all()
	for (const category of categories) {
		let items = _.filter(streams, { channel: { categories: [category.id] } })
		output.push({ id: category.id, items })
	}

	let items = _.filter(streams, s => !s.categories.length)
	items = items.map(item => {
		item.group_title = 'Other'
		return item
	})
	output.push({ id: 'other', items })

	return output
}
