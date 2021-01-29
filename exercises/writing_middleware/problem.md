# Writing Boltzmann Middleware

Middleware, so named because it sits in the "middle" of two other wares, is
a common concept in HTTP frameworks with a lot of different interpretations.

Boltzmann treats middleware as an onion. Boltzmann middleware is responsible for
producing an adaptor, which accepts a `next` function and returns a handler. The
handler receives `Context` objects whenever a request passes through it, and may
(or may not) call the `next` function zero to many times. The most basic pass-through
middleware is as follows:

```js
const myMiddleware = () => next => async context => next(context)
#     middleware:    ^------------------------------------------^
#     the adaptor part:    ^------------------------------------^
#     the handler part:            ^----------------------------^
```

It's not very useful, yet! Usually you'll do configuration validation in the
**middleware part**, any setup that needs to be done for the lifetime of the app
in the **adaptor part**, and any logic that needs to run on every request in the
**handler part**. (Notably, the **adaptor part** can be async, too!)

One common pattern is to create an instance of a client for an external service
in the **adaptor** part using config from the **middleware part**, then attach
it to every context passed to the **handler part**. This is handy because,
under test, boltzmann allows you to inject different middleware than your
production app; this allows for zero-dependency mocking of external
dependencies. An example middleware might look like:

```js
const myRedisMiddleware = ({connectionString = process.env.REDIS_URL} = {}) => {
  assert(connectionString, 'parameter "connectionString" is required!') // config validation

  return async next => {
    const client = redis.createClient() // make a client and make sure it works
    await client.pingAsync()

    return context => {
      context.redisClient = client // now attach it in the handler
      return next(context)
    }
  }
}
```

This lesson created a `writing-middleware` directory for you. `cd` into it now.
In this lesson, we've provided a client class for your in `middleware.js`; your
goals are:

(1) to write a middleware that validates its config: it should take one
argument and assert that it is a string;

(2) to instantiates a client in the **adaptor** part of your middleware
**once**;

(3) to attach that client to `context` as `context.myClient` in the **handler
part** of your middleware.

_(Make sure to export your middleware from `middleware.js` as `attachClient`!)_

Once you've written your middleware, use `boltzshopper run .` to check your
work! If it looks like it passed, run `boltzshopper verify .`.
