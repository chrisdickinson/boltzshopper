# Accepting input

[[ introductory concepts ]]

Now let's put together concepts to build something that looks more like what we need to build in real contexts.

// cover `await context.body`

`context.body` returns a promise for a fully-parsed body object.


This lesson created a scaffold for you in `./accepting-input/`. `cd` there now.

The scaffold project gives you three handlers for an in-memory book database. Use the functions provided on the `books` instance to fill out the full RESTful interface to the books database.

1. Add query param filtering to `GET /books` in `listBooks()` so the following queries work:

- `GET /books?genre=<string>`
- `GET /books?author=<string>`

2. Implement `addBook()` to accept data for a new book from POST data and store the book in the databases. The handler should respond with the ID for the newly-stored book.

3. As a next step, implement _input validation_ for all the handlers that accept input.

Once you've implemented the handlers, use `boltzshopper run .` to check your work! If it looks like it
passed, run `boltzshopper verify .`.
