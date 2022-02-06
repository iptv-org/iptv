const { create: createPlaylist } = require('../core/playlist')
const api = require('../core/api')
const file = require('../core/file')
const _ = require('lodash')

const PUBLIC_DIR = process.env.PUBLIC_DIR || '.gh-pages'

module.exports = async function (streams = []) {
	const logs = []

	await api.categories.load()
	const categories = await api.categories.all()

	for (const category of categories) {
		let output = _.filter(streams, { channel: { categories: [category.id] } })
		output = _.orderBy(
			output,
			['channel.name', 'status.level', 'resolution.height'],
			['asc', 'asc', 'desc']
		)
		output = _.uniqBy(output, s => s.channel_id || _.uniqueId())

		const playlist = createPlaylist(output, { public: true })
		await file.create(`${PUBLIC_DIR}/categories/${category.id}.m3u`, playlist.toString())

		logs.push({ id: category.id, count: output.length })
	}

	let output = _.filter(streams, s => !s.categories.length)
	output = _.orderBy(
		output,
		['channel.name', 'status.level', 'resolution.height'],
		['asc', 'asc', 'desc']
	)
	output = _.uniqBy(output, s => s.channel_id || _.uniqueId())
	output = output.map(item => {
		item.group_title = 'Other'
		return item
	})

	const playlist = createPlaylist(output, { public: true })
	await file.create(`${PUBLIC_DIR}/categories/other.m3u`, playlist.toString())

	logs.push({ id: 'other', count: output.length })

	return logs
}
