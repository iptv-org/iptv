const log = {}

log.print = function (string) {
  process.stdout.write(string)
}

log.start = function () {
  this.print('Starting...\n')
  console.time('\nDone in')
}

log.finish = function () {
  console.timeEnd('\nDone in')
}

module.exports = log
