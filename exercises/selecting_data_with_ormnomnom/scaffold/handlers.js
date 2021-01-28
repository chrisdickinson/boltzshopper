'use strict'

const { Context } = require('./boltzmann.js')
const Book = require('./models.js')

list.route = 'GET /'
async function list(/** @type {Context} */ context) {
  Book.objects.all()
  return {}
}

detail.route = 'GET /:slug'
async function detail(/** @type {Context} */ context) {
  Book.objects.all()
  return {}
}

module.exports = {
  list,
  detail,
}
