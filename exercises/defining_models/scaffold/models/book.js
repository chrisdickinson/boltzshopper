'use strict'

const orm = require('ormnomnom')
const Author = require('./author.js')

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
    static objects = null
}

module.exports = Book
