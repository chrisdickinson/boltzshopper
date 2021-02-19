'use strict'

const orm = require('ormnomnom')
const Author = require('./author.js')
const S = require('fluent-json-schema')

class Book {
    constructor({ id, title, author, author_id, genre, published, summary }) {
        this.id = id;
        this.title = title
        this.genre = genre // it's okay if this is missing
        this.published = published; // this is a year number
        this.summary = summary; // it's okay if this is missing
        // Author is a foreign key relation to another model.
        this.author_id = author_id
        this.author = author
    }

    // TODO: make this a model definition
    static objects = orm(Book, {
      id: S.number(),
      title: S.string().minLength(1),
      genre: S.anyOf([S.string().minLength(1), S.null()]),
      published: S.integer(),
      summary: S.anyOf([S.string().minLength(1), S.null()]),
      author: orm.fk(Author)
    })
}

module.exports = Book
