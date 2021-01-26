# Controlling Response Status Codes and Headers

Boltzmann uses [Symbols](https://mdn.io/symbol.for) to control response HTTP
metadata. Boltzmann looks for `Symbol`-attached HTTP Metadata on any value
your handlers or middleware produce, whether returned or thrown. Boltzmann
will also enforce certain metadata based on the type of value produced --
for example, strings are assumed to be `Content-Type: text/plain`. Boltzmann
will also fill in missing metadata based on the manner in which the value
was produced. Thrown values automatically produce a `500 Internal Server Error`
status code if none is specified, while returned responses receive a `200 OK`
by default.

This lesson created a scaffold for you in `./http-metadata/`, `cd` there now.

In this lesson, we have two handlers: one throwing an error, and one returning
a response. We want to give the error status code a `418` response type, while
giving the plain response a `203` status code and a `wow-great-header:
a great value` response header.

----chris left off editing here, feel free to reword / edit / finish anything
Boltzmann combines request routing and request handling: all handlers and
routes attached to your app are found by loading `require("handlers")`. Any
function with a `.route` property is attached to your application.

You respond to requests by returning (or throwing) values. Strings become plain
text responses, while objects are automatically `JSON.stringify`'d.

You can read more about these behaviors in the [Boltzmann Routing concept
documentation](https://www.boltzmann.dev/en/docs/latest/concepts/handlers/).

Starting this lesson created a scaffold for you in `./writing-handlers/`. `cd` there
now.

For this lesson, we want to add a handler that responds to `GET /hello/:foo`
with whatever `foo` was, uppercased. You can add it to `handlers.js`. You can
see all routes attached to your application using `npm run boltzmann:routes`,
or start your application using `npm start`.

Once you've added the route, use `boltzshopper run .` to check your work! If it
looks like it passed, run `boltzshopper verify .`.
