'use strict'

const { Context } = require('./boltzmann.js')
module.exports = {
  indexHandler,
}

indexHandler.route = 'GET /'
async function indexHandler(/** @type {Context} */ context) {
  const name = 'Friendly Boltzmann Author'
  
  return {
    message: `welcome to boltzmann, ${name}!`,
  }
}
