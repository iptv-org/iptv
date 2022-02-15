const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, stream => stream.is_nsfw === false)

	let languages = []
	streams.forEach(stream => {
		languages = languages.concat(stream.languages)
	})
	languages = _.uniqBy(languages, 'code')
	languages = _.sortBy(languages, 'name')

	const output = []
	for (const language of languages) {
		let items = _.filter(streams, { languages: [{ code: language.code }] })
		if (items.length) {
			output.push({ filepath: `languages/${language.code}.m3u`, items })
		}
	}

	let items = _.filter(streams, stream => !stream.languages.length)
	output.push({ filepath: 'languages/undefined.m3u', items })

	return output
}
