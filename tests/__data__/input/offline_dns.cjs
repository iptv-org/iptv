const dns = require('node:dns')

dns.lookup = (_hostname, callback) => callback(new Error('offline'))
