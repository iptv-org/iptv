const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => stream.is_nsfw === false)

	let items = []
	streams.forEach(stream => {
		if (!stream.categories.length) {
			const item = _.cloneDeep(stream)
			item.group_title = 'Undefined'
			items.push(item)

			return
		}

		stream.categories
			.filter(c => c)
			.forEach(category => {
				const item = _.cloneDeep(stream)
				item.group_title = category.name
				items.push(item)
			})
	})

	items = _.sortBy(items, item => {
		if (item.group_title === 'Undefined') return ''

		return item.group_title
	})

	return { filepath: 'index.category.m3u', items }
}
