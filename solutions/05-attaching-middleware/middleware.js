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

function myOtherMiddleware ({
  url = process.env.PINE_URL
} = {}) {
  return next => {
    const client = new Client()
    return context => {
      context.myClient = client
      return next(context)
    }
  }
}

const passThrough = () => next => context => next(context)

module.exports = {
  myMiddleware,
  APP_MIDDLEWARE: [
    [myMiddleware, 'hello world'],
    myOtherMiddleware,
    passThrough
  ]
}
