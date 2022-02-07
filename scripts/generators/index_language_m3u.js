const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)
	let items = []
	streams.forEach(stream => {
		if (!stream.languages.length) return items.push(stream)

		stream.languages.forEach(language => {
			const item = _.cloneDeep(stream)
			item.group_title = language.name
			items.push(item)
		})
	})
	items = _.sortBy(items, i => {
		if (i.group_title === 'Undefined') return '_'
		return i.group_title
	})

	return { filepath: 'index.language.m3u', items }
}
