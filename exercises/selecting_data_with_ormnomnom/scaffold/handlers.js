'use strict'

const { Context } = require('./boltzmann.js') // optionally pull in typescript definition

index.route = 'GET /'
async function index(/** @type {Context} */ context) {
  const name = 'Friendly Boltzmann Author'
  
  return {
    message: `welcome to boltzmann, ${name}!`,
  }
}

greeting.route = 'GET /hello/:name'

async function greeting(/** @type {Context} */ context) {
  return `hello ${context.params.name}`
}


module.exports = {
  index,
  greeting,
}
