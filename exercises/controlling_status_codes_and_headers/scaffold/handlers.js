'use strict'

const { Context } = require('./boltzmann.js')

greeting.route = 'GET /hello/:name'
async function greeting(/** @type {Context} */ context) {
  // look for "name" in context.params!
}

module.exports = {
  greeting,
}
