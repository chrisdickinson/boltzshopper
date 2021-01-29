'use strict'

const { Context, middleware } = require('./boltzmann.js')
const S = require('fluent-json-schema')
const Book = require('./models.js')

const slugify = str => str.replace(/([^a-zA-Z0-9\-]+)/g, '-').replace(/-+/g, '-').toLowerCase()

list.route = 'GET /'
async function list(/** @type {Context} */ context) {
  return Book.objects.all().connection(await context.postgresClient)
}

detail.route = 'GET /:slug'
async function detail(/** @type {Context} */ context) {
  // HINT: look at models.js to see how we're assigning the 404 status code to
  // missing models
  return Book.objects.connection(await context.postgresClient).get({
    slug: context.params.slug
  })
}

create.route = 'POST /'
create.middleware = [
  [middleware.validate.body, S.object()
    .prop('title', S.string().minLength(1))
    .prop('author', S.string().minLength(1))
    .prop('published', S.integer())
    .prop('genre', S.integer())
    .required(['title', 'author']),
  ]
]
async function create(/** @type {Context} */ context) {
  // TODO: create the book, use slug() on the title
}

update.route = 'POST /:slug'
update.middleware = [
  [middleware.validate.body, S.object()
    .prop('title', S.string().minLength(1))
    .prop('author', S.string().minLength(1))
    .prop('published', S.integer())
    .prop('genre', S.integer())
  ]
]
async function update(/** @type {Context} */ context) {
  // TODO: update the book; update the slug
}

remove.route = 'DELETE /:slug'
async function remove(/** @type {Context} */ context) {
  // TODO: remove the book
}

module.exports = {
  list,
  detail,
  create,
  update,
  remove
}
