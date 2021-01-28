# Defining models

Boltzmann uses _data access objects_ to define how a JavaScript object maps to an object in a
database row and back again. The data access object connects javascript with the schemas in
postgres so ormnomnom can turn your code into sql meaningfully.

Here's a basic Cat model:

```js
'use strict'
const orm = require('ormnomnom')

module.exports = class Cat {
  constructor({ id, name, color }) {
    this.id = id
    this.name = name
    this.color = color
    this.is_adorable = true
  }

  // This is the data access object!
  static objects = orm(Cat, {
    id: { type: 'integer' },
    name: { type: 'string' },
    color: { type: 'string' },
    is_adorable: { type: 'boolean' }
  })
}
```

By convention, `Cat.objects` is where the data access object is found, but this is only convention.
The schema used to define fields is the same used in Boltzmann: [ajv](https://ajv.js.org).
You can also use [fluent-json-schema](https://github.com/fastify/fluent-json-schema) in place of
the syntax above, if you prefer.

You can learn more about defining models in the ormnomnom docs chapter on
[models](https://github.com/chrisdickinson/ormnomnom/blob/master/docs/building-models.md). You'll
also want to have the [queryset documentation](https://github.com/chrisdickinson/ormnomnom/blob/f770e9770cd73f449a9d9e7df0875f90c9511175/docs/making-queries.md)
handy for the later parts of this exercise.

Starting this lesson created a scaffold for you in `./defining-models/`. `cd` there now. You'll need
to have Docker running to provide a PostgreSQL database for you to run your code against.

The file `book.js` contains a start at a model definition for the books database we saw in an
earlier exercise.

Fill out the Author model in `models/author.js` to give it a data access object on `Author.objects`,
with an appropriate schema.

Do the same in `models/book.js` with `Book.objects`. This time you'll need to define a foreign key
relation for authors.

Once this is working, take a look at the query in `handler.js:listBooks()`. It responds with a list
of books, but the list is missing author information.

Once you've added the route, use `boltzshopper run .` to check your work! If it looks like it
passed, run `boltzshopper verify .`. Tip: You can use `boltzshopper run .` to get a hint about what
to implement next.
