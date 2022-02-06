const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	const output = []
	await api.languages.load()
	let languages = await api.languages.all()
	languages = _.uniqBy(languages, 'code')
	for (const language of languages) {
		let items = _.filter(streams, { channel: { languages: [language.code] } })
		if (items.length) {
			output.push({ filepath: `languages/${language.code}.m3u`, items })
		}
	}

	let items = _.filter(streams, s => !s.languages.length)
	output.push({ filepath: 'languages/undefined.m3u', items })

	return output
}
