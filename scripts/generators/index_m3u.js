const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	streams = _.filter(streams, s => !s.channel || s.channel.is_nsfw === false)
	return { filepath: 'index.m3u', items: streams }
}
