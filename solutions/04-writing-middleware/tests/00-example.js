'use strict'

const { test } = require('tap')
const { middleware } = require('../boltzmann')
const { APP_MIDDLEWARE, attachClient } = require('../middleware')
const Client = require('../client')

const _ = middleware.test({
  middleware: [
    // middleware.log, // uncomment to enable request logging output from tests
  ], // by default, no middleware is installed under test.
})

test('attachClient asserts that its first argument is a string', async assert => {
  assert.throws(() => attachClient(0xdeadbeef))
})

test('attachClient attaches a client at "myClient"', async assert => {
  const result = await attachClient("foo")(context => context)(expected)

  assert.ok(result.myClient)
  assert.isa(result.myClient, Client)
})

test('application installs the attachClient middleware', async assert => {
  APP_MIDDLEWARE.some(xs => [].concat(xs)[0] === attachClient)
})

test('handler installs the attachClient middleware', async assert => {
  const handlers = require('../handlers')
  assert.ok(Array.isArray(handlers.index.middleware))
  handlers.index.middleware.some(xs => [].concat(xs)[0] === attachClient)
})

test(
  'a basic health check of the test machinery',
  _(async (t) => {
    t.ok('yay')
  })
)
