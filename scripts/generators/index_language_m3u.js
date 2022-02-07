const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)

	await api.languages.load()
	let languages = await api.languages.all()
	languages = _.keyBy(languages, 'code')

	let items = []
	streams.forEach(stream => {
		if (!stream.channel || !stream.channel.languages.length) {
			const item = _.cloneDeep(stream)
			item.group_title = null
			items.push(stream)
			return
		}

		stream.channel.languages.forEach(code => {
			const item = _.cloneDeep(stream)
			item.group_title = languages[code] ? languages[code].name : null
			items.push(item)
		})
	})
	items = _.sortBy(items, i => {
		if (!i.group_title) return ''
		return i.group_title
	})

	return { filepath: 'index.language.m3u', items }
}
