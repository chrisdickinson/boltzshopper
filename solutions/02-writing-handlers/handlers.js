'use strict'

const { Context } = require('./boltzmann.js')

greeting.route = 'GET /hello/:name'
async function greeting(/** @type {Context} */ context) {
  return context.params.name.toUpperCase()
}

module.exports = {
  greeting,
}
