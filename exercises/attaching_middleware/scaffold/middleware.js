'use strict'

const { middleware } = require('./boltzmann')

const Client = require('./client')

function myMiddleware (greeting = 'こんにちは') {
  return next => {
    const client = new Client()
    return context => {
      context.myClient = client
      return next(context)
    }
  }
}

module.exports = {
  myMiddleware,
  APP_MIDDLEWARE: []
}
