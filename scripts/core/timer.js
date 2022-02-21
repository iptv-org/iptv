const { performance } = require('perf_hooks')
const dayjs = require('dayjs')
const duration = require('dayjs/plugin/duration')
const relativeTime = require('dayjs/plugin/relativeTime')

dayjs.extend(relativeTime)
dayjs.extend(duration)

const timer = {}

let t0 = 0

timer.start = function () {
  t0 = performance.now()
}

timer.format = function (f) {
  let t1 = performance.now()

  return dayjs.duration(t1 - t0).format(f)
}

timer.humanize = function (suffix = true) {
  let t1 = performance.now()

  return dayjs.duration(t1 - t0).humanize(suffix)
}

module.exports = timer
