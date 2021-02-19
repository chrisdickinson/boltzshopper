'use strict'

const { Context } = require('./boltzmann.js')
const Book = require('./models/book.js')

// Get an array of all books in the database.
listBooks.route = 'GET /books'
async function listBooks(/** @type {Context} */ context) {
  const pgclient = await context.postgresClient
  return Book.objects.connection(pgclient).filter({
    'author.id:isNull': false
  }).order('author.name')
}

module.exports = {
  listBooks,
}
