'use strict'

const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const path = require('path')
const util = require('util')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'writing-middleware')
  if (!fs.existsSync(dest) && !process.cwd().includes('writing-middleware')) {
    cpr(path.join(__dirname, 'scaffold'), dest, install)
  } else {
    return ready()
  }

  function install(err) {
    if (err) {
      return ready(err)
    }

    const proc = child_process.spawn('npm', ['ci'], {
      cwd: dest
    })

    proc.on('exit', code => {
      if (code !== 0) {
        return ready(new Error(`got ${code} from "npm ci"`))
      }

      ready()
    })
  }
})

exercise.addProcessor((mode, ready) => {
  let submission = path.resolve(exercise.args[0] || process.cwd())

  fs.stat(submission, (err, stat) => {
    if ((err && err.code == 'ENOENT') || !stat) {
      return ready(new Error('No such file or directory: ' + submission))
    }

    if (err) {
      return ready(err)
    }

    if (stat.isFile()) {
      submission = path.dirname(submission)
    }

    submission = path.join(submission, 'package.json')
    fs.stat(submission, (...args) => checkmiddleware(...args).catch(ready))
  })

  async function checkmiddleware (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat) {
      return ready(new Error(`Could not find package.json; tried "${submission}". Are you running boltzshopper from your solution directory?`))
    }

    if (!stat.isFile()) {
      return ready(new Error(`Found package.json, but it wasn't a file! That's pretty strange!`))
    }

    const clientpath = path.join(path.dirname(submission), 'client.js')
    var Client = null
    try {
      Client = require(clientpath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${clientpath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    let instantiated = 0
    require.cache[clientpath].exports = class extends Client {
      constructor(...args) {
        super(...args)
        ++instantiated
      }
    }

    const middlewarepath = path.join(path.dirname(submission), 'middleware.js')
    var middleware = null
    try {
      middleware = require(middlewarepath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${middlewarepath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    // 1st, make sure we're exporting a middleware!
    if (!middleware.attachClient) {
      exercise.emit('fail', 'it looks like you haven\'t exported an "attachClient" middleware from middleware.js')
      return ready(null, false)
    }

    if (typeof middleware.attachClient !== 'function') {
      exercise.emit('fail', 'attachClient should be a function')
      return ready(null, false)
    }

    // 2nd, test that the client was not instantiated yet
    if (instantiated > 0) {
      exercise.emit('fail', 'it looks like you called "new Client" before the middleware was set up')
      return ready(null, false)
    }

    // 3rd, test that calling the middleware returns a function, AND that we haven't instantiated a client yet
    var adaptor
    try {
      adaptor = middleware.attachClient()
    } catch (err) {
      exercise.emit('fail', `caught an error trying to execute attachClient: ${err.stack}`)
      return ready(null, false)
    }

    if (typeof adaptor !== 'function') {
      exercise.emit('fail', `attachClient should return an adaptor function; saw "${util.format(adaptor)}" instead`)
      return ready(null, false)
    }

    if (instantiated > 0) {
      exercise.emit('fail', 'it looks like you called "new Client" in the config portion of the middleware')
      return ready(null, false)
    }

    let nextExecuted = 0
    const next = (...args) => {
      ++nextExecuted
      return args
    }
    var handler
    try {
      handler = await adaptor(next)
    } catch (err) {
      exercise.emit('fail', `caught an error trying to execute adaptor returned by attachClient: ${err.stack}`)
      return ready(null, false)
    }

    if (instantiated !== 1) {
      exercise.emit('fail', 'the adaptor should have called `new Client()`, but didn\'t')
      return ready(null, false)
    }

    const expected = {}
    var response
    try {
      response = await handler(expected)
    } catch (err) {
      exercise.emit('fail', `caught an error trying to execute handler returned by attachClient adaptor: ${err.stack}`)
      return ready(null, false)
    }

    if (instantiated !== 1) {
      exercise.emit('fail', 'the handler should use the client instance instantiated in the adaptor, but recreated instead')
      return ready(null, false)
    }

    if (nextExecuted < 1) {
      exercise.emit('fail', `attachClient handler did not call "next(context)"`)
      return ready(null, false)
    }

    if (nextExecuted > 1) {
      exercise.emit('fail', `attachClient handler called "next(context)" too many times`)
      return ready(null, false)
    }

    if (expected !== response[0]) {
      exercise.emit('fail', `expected attachClient handler to return the result of calling "next(context)"`)
      return ready(null, false)
    }

    if (!expected.myClient || !(expected.myClient instanceof Client)) {
      exercise.emit('fail', `expected attachClient handler to attach client instance as context.myClient`)
      return ready(null, false)
    }

    if (!expected.myClient) {
      exercise.emit('fail', `expected attachClient handler to attach client instance as context.myClient`)
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve written a Boltzmann middleware! You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }
    return ready(null, true)
  }
})

module.exports = exercise
