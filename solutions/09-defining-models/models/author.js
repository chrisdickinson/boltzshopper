'use strict'

const orm = require('ormnomnom')
const S = require('fluent-json-schema')

class Author {
  constructor({ id, name }) {
    this.id = id
    this.name = name // cannot be empty
  }

  // TOOD: make this a model definition
  static objects = orm(Author, {
    id: S.number(),
    name: S.string().minLength(1)
  })
}

module.exports = Author
