const _ = require('lodash')
const logger = require('./logger')
const setters = require('../store/setters')
const getters = require('../store/getters')

module.exports = {
  create(state = {}) {
    return {
      state,
      changed: false,
      set: function (prop, value) {
        const prevState = JSON.stringify(this.state)

        const setter = setters[prop]
        if (typeof setter === 'function') {
          try {
            this.state[prop] = setter.bind()(value)
          } catch (error) {
            logger.error(`store/setters/${prop}.js: ${error.message}`)
          }
        } else if (typeof value === 'object') {
          this.state[prop] = value[prop]
        } else {
          this.state[prop] = value
        }

        const newState = JSON.stringify(this.state)
        if (prevState !== newState) {
          this.changed = true
        }

        return this
      },
      get: function (prop) {
        const getter = getters[prop]
        if (typeof getter === 'function') {
          try {
            return getter.bind(this.state)()
          } catch (error) {
            logger.error(`store/getters/${prop}.js: ${error.message}`)
          }
        } else {
          return prop.split('.').reduce((o, i) => (o ? o[i] : undefined), this.state)
        }
      },
      has: function (prop) {
        const value = this.get(prop)

        return !_.isEmpty(value)
      },
      data: function () {
        return this.state
      }
    }
  }
}
