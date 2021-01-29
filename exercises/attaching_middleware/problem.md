# Attaching Boltzmann Middleware

So, we've written our middleware. If you've run your application, you may have
noticed that it isn't actually doing anything yet! That's because we haven't
**attached** the middleware.

Boltzmann middleware can be attached at the **application** level or at the
**handler** level. **Application**-attached middleware runs whenever your
application receives a request.

You can attach middleware to your application using the `APP_MIDDLEWARE` export
in `middleware.js`, while handlers support middleware attachment via the
`.middleware` property:

```js
// middleware.js                  // handlers.js
module.exports = {                index.route = 'GET /'
  APP_MIDDLEWARE: [               index.middleware = [
    myMiddleware                    myMiddleware
  ]                               ]
}                                 async function index (context) {
                                  }
```

You can read more about attaching middleware in the boltzmann docs [1].

Boltzmann separates middleware **configuration** from middleware
**instantiation**. In other words, you give Boltzmann your middleware and
configuration, and Boltzmann will take care of calling it for you at the
appropriate time. Configuration uses **Babel** style arrays: if you pass the
function directly, Boltzmann will call the middleware with no arguments. If the
line is an array with the middleware function as the first element, all
subsequent elements are treated as arguments:

```js
index.route = 'GET /'
index.middleware = [
  myMiddleware,                                   // myMiddleware()
  [complexMiddleware, {something: 'foo'}, 'bar']  // complexMiddleware({something: 'foo'}, 'bar')
]
async function index (context) {
}
```

This lesson created a `attaching-middleware` directory for you. `cd` there now.
This lesson provides 1 handler and middleware, `indexHandler` and `myMiddleware`.

(1) To the `indexHandler` middleware, attach the `myMiddleware` middleware with
no arguments.

(2) To the application, attach `myMiddleware` with one arg, `"hello world"`.

(3) Write your own pass-through middleware and attach it to the application
after `myMiddleware`.

Once you've written your middleware, use `boltzshopper run .` to check your
work! If it looks like it passed, run `boltzshopper verify .`

[1]: https://www.boltzmann.dev/en/docs/latest/concepts/middleware/#attaching-configuring-middleware
