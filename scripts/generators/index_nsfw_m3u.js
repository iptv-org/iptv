const api = require('../core/api')
const _ = require('lodash')

module.exports = async function (streams = []) {
	return { filepath: 'index.nsfw.m3u', items: streams }
}
