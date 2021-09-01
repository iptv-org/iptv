const log = {}

log.print = function (message) {
  if (typeof message === 'object') message = JSON.stringify(message, null, 2)
  process.stdout.write(message)
}

log.start = function () {
  this.print('Starting...\n')
  console.time('Done in')
}

log.finish = function () {
  console.timeEnd('Done in')
}

module.exports = log
