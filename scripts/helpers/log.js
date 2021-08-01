const log = {}

log.print = function (string) {
  process.stdout.write(string)
}

log.start = function () {
  this.print('Starting...\n')
  console.time('Done in')
}

log.finish = function () {
  console.timeEnd('Done in')
}

module.exports = log
