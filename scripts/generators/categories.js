const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	await api.categories.load()
	const categories = await api.categories.all()

	const output = []
	for (const category of categories) {
		let items = _.filter(streams, { categories: [{ id: category.id }] })
		output.push({ filepath: `categories/${category.id}.m3u`, items })
	}

	let items = _.filter(streams, stream => !stream.categories.length)
	output.push({ filepath: 'categories/undefined.m3u', items })

	return output
}
