'use strict'

const S = require('fluent-json-schema')
const orm = require('ormnomnom')

orm.describeConflict('book_slug_idx', 'Duplicate book')

class Book {
  constructor ({ id, title, slug, author, year, genre } = {}) {
    this.id = id
    this.title = title
    this.slug = slug
    this.author = author
    this.year = year
    this.genre = genre
  }

  // when rendering a Book to JSON, omit the database identifier (it's
  // an implementation detail users don't care about!)
  toJSON () {
    const { id: _, ...rest } = this
    return rest
  }

  static objects = orm(Book, {
    id: S.integer(),
    title: S.string().minLength(1).maxLength(200),
    slug: S.string().minLength(1).pattern('^[a-zA-Z0-9\\-]+$'),
    author: S.string().minLength(1),
    year: S.integer().default(2002),
    genre: S.string().default('N/A')
  })
}

// Every NotFound error is a 404 HTTP error. 
Book.NotFound.prototype[Symbol.for('status')] = 404

module.exports = Book
