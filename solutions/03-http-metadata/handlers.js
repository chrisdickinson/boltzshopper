'use strict'

const { Context } = require('./boltzmann.js')

class MyApplicationError extends Error {
  [Symbol.for('status')] = 418
}

throws.route = 'GET /throws'
async function throws(/** @type {Context} */ context) {
  throw new MyApplicationError('wow')
}

headers.route = 'GET /headers'
async function headers(/** @type {Context} */ context) {
  const response = {
    message: 'this is a string response',
    count: 42,
    [Symbol.for('status')]: 203,
    [Symbol.for('headers')]: {
      'wow-great-header': 'a great value',
      'garbage': 'headers',
      'wow': 'such garbage',
      'eek': ['a raccoon', 'another raccoon'],
      'probably': 'here for the garbage',
    }
  }
  return response
}

module.exports = {
  throws, headers
}
