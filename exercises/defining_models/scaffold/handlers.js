'use strict'

const { Context } = require('./boltzmann.js')
const Book = require('./models/book.js')

// Get an array of all books in the database.
listBooks.route = 'GET /books'
async function listBooks(/** @type {Context} */ context) {
  const pgclient = await context.postgresClient()
  // TODO: This should include information about authors as well!
  // And the product designers want it sorted by author because that's how we shelve them.
  return Book.objects.connection(pgclient).filter({})
}

module.exports = {
  listBooks,
}
