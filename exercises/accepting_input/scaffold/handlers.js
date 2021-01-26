'use strict'

const { Context, middleware } = require('./boltzmann.js') // optionally pull in typescript definition
const crypto = require('crypto')

// A very performant book database using md5 hashes of the title as indexes.
class BookDB {
  constructor() {
    this.db = {}
  }

  all() {
    return this.db
  }

  get(id) {
    return this.db[id]
  }

  add(book) {
    const id = BookDB.makeid(book.title)
    this.db[id] = book
    return id
  }

  static makeid(title) {
    return crypto.createHash('md5').update(title).digest('hex')
  }
}

const books = new BookDB()
books.add({ title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 })
books.add({ title: 'Dirk Gently\'s Holistic Detective Agency', author: 'Douglas Adams', year: 1987 })
books.add({ title: 'Small Gods', author: 'Terry Pratchett', year: 1992 })
books.add({ title: 'The Art of Programming, Vol 1', author: 'Donald Knuth', year: 1968 })

listBooks.route = 'GET /books'
async function listBooks(/** @type {Context} */ context) {
  return books.all()
}

bookByID.route = 'GET /books/book/:id'
async function bookByID(/** @type {Context} */ context) {
  // TODO: respond with 200 +  the book identified by `id`
  // respond with 404 if not found
}

addBook.route = 'POST /books'
async function addBook(/** @type {Context} */ context) {
  // TODO: add a book to our list
  // validate input to be sure it has a title
  // respond with the generated id
}

module.exports = {
  listBooks,
  bookByID,
  addBook,
}
