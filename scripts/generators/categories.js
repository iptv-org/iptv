const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	const output = []
	await api.categories.load()
	const categories = await api.categories.all()
	for (const category of categories) {
		let items = _.filter(streams, { channel: { categories: [category.id] } })
		output.push({ id: category.id, items })
	}

	let items = _.filter(streams, s => !s.categories.length)
	output.push({ id: 'undefined', items })

	return output
}
