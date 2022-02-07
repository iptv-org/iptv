const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)

	await api.languages.load()
	let languages = await api.languages.all()
	languages = _.uniqBy(languages, 'code')

	const output = []
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
