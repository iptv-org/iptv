const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)

	await api.categories.load()
	let categories = await api.categories.all()
	categories = _.keyBy(categories, 'id')

	let items = []
	streams.forEach(stream => {
		if (!stream.channel || !stream.channel.categories.length) {
			const item = _.cloneDeep(stream)
			item.group_title = null
			items.push(item)

			return
		}

		stream.channel.categories.forEach(id => {
			const item = _.cloneDeep(stream)
			item.group_title = categories[id] ? categories[id].name : null
			items.push(item)
		})
	})

	items = _.sortBy(items, item => {
		if (!item.group_title) return ''

		return item.group_title
	})

	return { filepath: 'index.category.m3u', items }
}
