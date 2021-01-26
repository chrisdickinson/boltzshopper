'use strict'

const { middleware } = require('./boltzmann')

// All Boltzmann middleware looks like this.
// Middleware can be attached to either the app or individual routes.
function setupMiddlewareFunc(/* your config */) {
  // startup configuration goes here
  return function createMiddlewareFunc(next) {
    return async function inner(context) {
      // do things like make objects to put on the context
      // then give following middlewares a chance
      // route handler runs last
      // awaiting is optional, depending on what you're doing
      const result = await next(context)
      // do things with result here; can replace it entirely!
      // and you're responsible for returning it
      return result
    }
  }
}

// Here's a more compactly-defined middleware.
function routeMiddlewareFunc(/* your config */) {
  return (next) => {
    return (context) => {
      return next(context)
    }
  }
}

// This export is special: it instructs Boltzmann to attach
// middlewares to the app in this order.
// This is also where you can configure built-in middleware.
const APP_MIDDLEWARE = [
  setupMiddlewareFunc,
  // [middleware.session, {
  // secret: process.env.SESSION_SECRET || 'a very secure secret set surreptitiously'.repeat(5),
  // salt: process.env.SESSION_SALT || 'fifteen pounds of salt',
  // cookieOptions: {}
  // }],
]

module.exports = {
  // This export is special: it instructs Boltzmann to attach middlewares to the app in this
  // order. This is also where you can configure built-in middleware.
  APP_MIDDLEWARE,

  // You can export middleware for testing or for attaching to routes.
  routeMiddlewareFunc,
  setupMiddlewareFunc,
}
