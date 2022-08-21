const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

dayjs.extend(utc)

const date = {}

date.utc = d => {
	return dayjs.utc(d)
}

module.exports = date
