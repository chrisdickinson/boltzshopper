'use strict'

const { Context } = require('./boltzmann.js')
const { myMiddleware } = require('./middleware')

module.exports = {
  indexHandler,
}

indexHandler.route = 'GET /'
indexHandler.middleware = [
  myMiddleware
]
async function indexHandler(/** @type {Context} */ context) {
  const name = 'Friendly Boltzmann Author'

  return {
    message: `welcome to boltzmann, ${name}!`,
  }
}
