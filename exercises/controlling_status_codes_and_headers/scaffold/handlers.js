'use strict'

const { Context } = require('./boltzmann.js')

throws.route = 'GET /throws'
async function throws(/** @type {Context} */ context) {
  throw new Error('this is a string error')
}

headers.route = 'GET /headers'
async function headers(/** @type {Context} */ context) {
  const response = {
    message: 'this is a string response',
    count: 42
  }
  return response
}

module.exports = {
  throws, headers
}
