const m3u = {}

m3u.create = function (links = [], header = {}) {
	let output = `#EXTM3U`
	for (const attr in header) {
		const value = header[attr]
		output += ` ${attr}="${value}"`
	}
	output += `\n`

	for (const link of links) {
		output += `#EXTINF:-1`
		for (const name in link.attrs) {
			const value = link.attrs[name]
			if (value !== undefined) {
				output += ` ${name}="${value}"`
			}
		}
		output += `,${link.title}\n`

		for (const name in link.vlcOpts) {
			const value = link.vlcOpts[name]
			if (value !== undefined) {
				output += `#EXTVLCOPT:${name}=${value}\n`
			}
		}

		output += `${link.url}\n`
	}

	return output
}

module.exports = m3u
