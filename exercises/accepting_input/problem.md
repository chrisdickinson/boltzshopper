# Accepting input

This exercise shows you how to accept input into your app and validate it.

The `context` argument to route handlers holds the information you need about incoming requests to
your service, including all data that came along with the request, parsed for use.

- `context.params`: route parameters
- `context.query`: query string parameters, parsed
- `context.body`: a promise for a fully-parsed body object

You can use Boltzmann's built-in _input validator_ middleware to validate input and respond with
status 400 when our requirements aren't met. Boltzmann's validators are built on top of
[ajv: another JSON Schema Validator](https://ajv.js.org). These validators are exported from
Boltzmann as `middleware.validate`:

* `middleware.validate.body()`: validate the incoming body
* `middleware.validate.query()`: validate the incoming query string
* `middleware.validate.params()`: validate the incoming route params

Each validator accepts an AJV schema definition object. You can create your schemas with
[fluent-json-schema](https://github.com/fastify/fluent-json-schema) if you prefer that to
writing POJOs.

Let's put together these concepts to build something that looks more like what we need to build in
real contexts. This lesson created a scaffold for you in `./accepting-input/`. `cd` there now.

The scaffold project gives you three handlers for an in-memory book database. Use the functions
provided on the `books` instance to fill out the full RESTful interface to the books database.

Add query param filtering to `GET /books` in `listBooks()` so at least the following queries work:

- `GET /books?genre=<string>`
- `GET /books?author=<string>`

Implement `addBook()` to accept data for a new book from POST data and store the book in the
databases. The handler should respond with the ID for the newly-stored book.

As a next step, implement _input validation_ for all the handlers that accept input. In particular,
add the requirement that books must have titles and authors to be added to the database.

Once you've implemented the handlers, use `boltzshopper run .` to check your work! If it looks like
it passed, run `boltzshopper verify .`.
