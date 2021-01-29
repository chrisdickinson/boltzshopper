# Mutating Data with ORMnomnom

Selecting data is all well and good, but what if you need to add new rows, delete
some rows, or change the contents of a row? ORMnomnom has you covered!

ORMnomnom data access objects provide a `.create({...data})` function for
inserting new rows. Querysets enable updating and deleting existing rows
based on filters you specify.

```javascript
await Book.objects.create({title: 'hello'})
await Book.objects.filter({author: 'Jane Austen'}).update({
  title: 'Sense and Sensibility'
})
await Book.objects.filter({published: 1984}).delete()
```

`.update()`, `.insert()`, and `.delete()` return `Promise`s, *not* a new
queryset -- they represent an action to be taken and cannot be chained.
You can read more about them in the ORMnomnom reference docs [1].

`.update()` and `.delete()` return the number of affected rows (as a string,
to account for older versions of Node that don't have BigInt support.) `.create()`
returns an instance of the model.

This lesson created a `mutating-data` directory for you. `cd` there now.

For this lesson, we've provided a `Book` model, a running postgres instance
with a schema and some populated records, and four handlers: `list`, `detail`,
`create`, `update`, and `remove`.

Your goal is to:

(1) Write an update handler: it should **404** if the book cannot be found by `slug`
or return the updated `Book` on a successful update.

(2) Write a delete handler: it should **404** if the book cannot be found by `slug`,
or return `204 No Content` on a successful deletion. (Note that returning `undefined`
from a Boltzmann handler automatically returns a 204!)

(3) Write a creation handler. It should attempt to create a new `Book` given the input,
using the provided `slugify()` function to generate a slug from the `title`. If there's
a book with the same `slug`, it should return a `409 Conflict`, otherwise returning
`201 Created` with a `Location` header pointing at the slug of the new book.

**Make sure you are running Docker!** Use `npm start` to run the server for
local testing, and `npm run sql` to get a psql shell. The postgres data is refreshed
on every run of the server, sql shell, and on `boltzshopper run/verify`.

[1]: https://github.com/chrisdickinson/ormnomnom/blob/master/docs/ref/queryset.md
