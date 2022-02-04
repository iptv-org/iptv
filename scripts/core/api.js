const _ = require('lodash')
const file = require('./file')

const DATA_DIR = process.env.DATA_DIR || './scripts/data'

class API {
  constructor(filepath) {
    this.filepath = file.resolve(filepath)
  }

  async load() {
    const data = await file.read(this.filepath)
    this.collection = JSON.parse(data)
  }

  find(query) {
    return _.find(this.collection, query)
  }
}

const api = {}

api.channels = new API(`${DATA_DIR}/channels.json`)
api.countries = new API(`${DATA_DIR}/countries.json`)

module.exports = api
