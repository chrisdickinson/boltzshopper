'use strict'

const assert = require('assert')

const Client = require('./client')

function attachClient (url, what) {
  assert(typeof url === 'string')

  return next => {
    const client = new Client(url)

    return async context => {
      context.myClient = client
      return await next(context)
    }
  }
  // YOUR CODE HERE!
}

function wow () {
  return next => {
    return async context => {
      try {
        return await next(context)
      } finally {
      }
    }
  }
  // YOUR CODE HERE!
}

module.exports = {
  attachClient,
  APP_MIDDLEWARE: [
    [attachClient, 'hello', 'world'],
    wow
  ]
}
