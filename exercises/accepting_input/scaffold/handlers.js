'use strict'

const { Context, middleware } = require('./boltzmann.js') // optionally pull in typescript definition
const crypto = require('crypto')

// A very performant and sophisticated book database using md5 hashes of the title as db indexes.
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

  filter(field, value) {
    const matches = []
    Object.keys(this.db).forEach(key => {
      if (this.db[key][field] === value) {
        matches.push(this.db[key])
      }
    })
    return matches
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

// Seed our database with some books we have around.
const books = new BookDB()
books.add({ title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, genre: 'satire' })
books.add({ title: 'Dirk Gently\'s Holistic Detective Agency', author: 'Douglas Adams', year: 1987, genre: 'SFF' })
books.add({ title: 'Small Gods', author: 'Terry Pratchett', year: 1992, genre: 'SFF' })
books.add({ title: 'The Art of Programming, Vol 1', author: 'Donald Knuth', year: 1968, genre: 'nonfiction' })

listBooks.route = 'GET /books'
async function listBooks(/** @type {Context} */ context) {
  // TODO filter books by the following query params:
  // genre=string
  // author=string
  // year=number
  return books.all()
}

addBook.decorators = []
bookByID.route = 'GET /books/book/:id'
async function bookByID(/** @type {Context} */ context) {
  const book = books.get(context.params.id)
  if (book) {
    return book
  }

  return Object.assign('Book not found', { [Symbol.for('status')]: 404 })
}

addBook.route = 'POST /books'
addBook.decorators = []
async function addBook(/** @type {Context} */ context) {
  // TODO: add a book to our list
  // validate input to be sure it has at least a title & author
  // respond with the generated id
}

module.exports = {
  listBooks,
  bookByID,
  addBook,
}
