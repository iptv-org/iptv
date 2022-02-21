const Database = require('nedb-promises')
const file = require('./file')

const DB_FILEPATH = process.env.DB_FILEPATH || './scripts/channels.db'

const nedb = Database.create({
  filename: file.resolve(DB_FILEPATH),
  autoload: true,
  onload(err) {
    if (err) console.error(err)
  },
  compareStrings: (a, b) => {
    a = a.replace(/\s/g, '_')
    b = b.replace(/\s/g, '_')

    return a.localeCompare(b, undefined, {
      sensitivity: 'accent',
      numeric: true
    })
  }
})

const db = {}

db.removeIndex = function (field) {
  return nedb.removeIndex(field)
}

db.addIndex = function (options) {
  return nedb.ensureIndex(options)
}

db.compact = function () {
  return nedb.persistence.compactDatafile()
}

db.reset = function () {
  return file.clear(DB_FILEPATH)
}

db.count = function (query) {
  return nedb.count(query)
}

db.insert = function (doc) {
  return nedb.insert(doc)
}

db.update = function (query, update) {
  return nedb.update(query, update)
}

db.find = function (query) {
  return nedb.find(query)
}

db.remove = function (query, options) {
  return nedb.remove(query, options)
}

module.exports = db
