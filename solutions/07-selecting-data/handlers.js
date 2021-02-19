'use strict'

const { Context } = require('./boltzmann.js')
const Book = require('./models.js')

list.route = 'GET /'
async function list(/** @type {Context} */ context) {
  return Book.objects.all().connection(await context.postgresClient).slice(0, 3)
}

detail.route = 'GET /:slug'
async function detail(/** @type {Context} */ context) {
  return Book.objects.all().connection(await context.postgresClient).get({
    slug: context.params.slug
  })
}

module.exports = {
  list,
  detail,
}
