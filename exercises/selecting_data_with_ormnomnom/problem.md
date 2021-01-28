# Selecting Data with ORMnomnom

ORMnomnom is an object-relational mapper, patterned after Django's, whose goal
is to make the 80% of database interaction work easier, while getting out of
your way for the remaining 20%.

It uses a set [1] abstraction, called "QuerySets", to build SQL queries based
on your models. You start from the set of "all records in this table", then
winnow down the set using calls to `.filter()`. You can also optionally use
`.slice()` to offset into (or limit!) the set of records returned. You can
read more about ORMnomnom's API here [1].

Querysets are lazily evaluated: they do not execute until you `await` them (or
`.pipe()` them to an output.)

```js
const [books] =
  Book.objects
    .connection(await context.postgresClient) // use this postgres client
    .filter({
      'published:gt': '1985-11-04',           // "key:<filter type>": <filter value>
      name: 'Design Patterns',                // "key": exact value
    })
    .slice(0, 10)
```

This lesson created a `selecting-data` directory for you. `cd` there now.

For this lesson, we've provided a `Book` model, a running postgres instance
with a schema and some populated records, and two handlers: `list` and
`detail`.

Your goal is to:

* Return an array of **3** books from the `list` endpoint.
    * BONUS: Use `context.query.name` to filter books by name (using `"name:iContains"`) [2]
* Lookup **1** book by `slug`. If there is no match, **return a 404**

**Make sure you are running Docker!** Use `npm start` to run the server for
local testing, and `npm run sql` to get a psql shell.

[1]: https://github.com/chrisdickinson/ormnomnom/tree/master/docs
[2]: https://github.com/chrisdickinson/ormnomnom/blob/master/docs/ref/queryset.md#clause-relations
