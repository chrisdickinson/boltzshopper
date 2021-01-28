'use strict'

const S = require('fluent-json-schema')
const orm = require('ormnomnom')

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
    title: S.string().minLength(1).maxLength(200).required(),
    slug: S.string().minLength(1).pattern('^[a-zA-Z0-9\\-]+$').required(),
    author: S.string().minLength(1).required(),
    year: S.integer(),
    genre: S.string()
  })
}

module.exports = Book
