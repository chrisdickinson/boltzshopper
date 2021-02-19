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
  const { title, author, published, genre } = await context.body
  const slug = slugify(title)

  const book = await Book.objects.connection(await context.postgresClient).create({
    title,
    author,
    published,
    genre,
    slug
  })

  return Object.assign(book, {
    [Symbol.for('status')]: 201,
    [Symbol.for('headers')]: {
      location: `/${book.slug}`
    }
  })
}

update.route = 'POST /:slug'
update.middleware = [
  [middleware.validate.body, S.object()
    .prop('title', S.string().minLength(1))
    .prop('author', S.string().minLength(1))
    .prop('published', S.integer())
    .prop('genre', S.string().minLength(1))
  ]
]
async function update(/** @type {Context} */ context) {
  const updated = await Book.objects.connection(await context.postgresClient).filter({slug: context.params.slug}).update(await context.body)

  if (Number(updated) < 1) {
    throw new Book.NotFound()
  }

  return Book.objects.connection(await context.postgresClient).get({slug: context.params.slug})
}

remove.route = 'DELETE /:slug'
async function remove(/** @type {Context} */ context) {
  const updated = await Book.objects.connection(await context.postgresClient).filter({slug: context.params.slug}).delete()

  if (Number(updated) < 1) {
    throw new Book.NotFound()
  }
}

module.exports = {
  list,
  detail,
  create,
  update,
  remove
}
