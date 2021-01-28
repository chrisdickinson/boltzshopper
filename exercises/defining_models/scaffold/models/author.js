'use strict'

const orm = require('ormnomnom')

class Author {
  constructor({ id, name }) {
    this.id = id
    this.name = name // cannot be empty
  }

  // TOOD: make this a model definition
  static objects = null
}

module.exports = Book
