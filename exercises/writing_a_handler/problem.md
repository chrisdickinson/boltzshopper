# Writing a Boltzmann Handler

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
