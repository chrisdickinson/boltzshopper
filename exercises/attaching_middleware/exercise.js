'use strict'

const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const path = require('path')
const util = require('util')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'attaching-middleware')
  if (!fs.existsSync(dest)) {
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

    const middlewarepath = path.join(path.dirname(submission), 'middleware')
    var middleware = null
    try {
      middleware = require(middlewarepath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${middlewarepath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    const handlerspath = path.join(path.dirname(submission), 'handlers')
    var handlers = null
    try {
      handlers = require(handlerspath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${handlerspath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!handlers || !handlers.indexHandler) {
      exercise.emit('fail', `Looks like you didn't export "indexHandler" from handlers.js!`)
      return ready(null, false)
    }

    if (typeof handlers.indexHandler !== 'function') {
      exercise.emit('fail', `Huh, "indexHandler" should be a function. It looks like this instead: ${util.format(handlers.indexHandler)}`)
      return ready(null, false)
    }

    if (!Array.isArray(handlers.indexHandler.middleware)) {
      exercise.emit('fail', `"indexHandler.middleware" should be an array with one element.`)
      return ready(null, false)
    }

    const idxmw = [].concat(handlers.indexHandler.middleware[0])
    if (typeof idxmw[0] !== 'function') {
      exercise.emit('fail', `the first element in "indexHandler.middleware" should be a middleware function.`)
      return ready(null, false)
    }

    if (!middleware || !middleware.myMiddleware) {
      exercise.emit('fail', `Looks like you didn't export "myMiddleware" from middleware.js!`)
      return ready(null, false)
    }

    if (idxmw[0] !== middleware.myMiddleware) {
      exercise.emit('fail', `the first element in "indexHandler.middleware" should be "myMiddleware". Make sure you haven't called it!`)
      return ready(null, false)
    }

    if (!Array.isArray(middleware.APP_MIDDLEWARE)) {
      exercise.emit('fail', `middleware.js should export APP_MIDDLEWARE, which should be an array.`)
      return ready(null, false)
    }

    if (middleware.APP_MIDDLEWARE.length < 2) {
      exercise.emit('fail', `expected two middlewares to be attached to the application.`)
      return ready(null, false)
    }

    if (typeof middleware.APP_MIDDLEWARE[0] === 'function') {
      exercise.emit('fail', `expected the first app-attached middleware to be configured with one argument, "hello world".`)
      return ready(null, false)
    }

    if (middleware.APP_MIDDLEWARE[0][0] !== middleware.myMiddleware) {
      exercise.emit('fail', `the first app-attached middleware should be "myMiddleware". Make sure you haven't called it!`)
      return ready(null, false)
    }

    if (middleware.APP_MIDDLEWARE[0][1] !== 'hello world') {
      exercise.emit('fail', `Expected one more element in the first app-attached middleware, "hello world"`)
      return ready(null, false)
    }

    const custom = [].concat(middleware.APP_MIDDLEWARE[1])
    if (typeof custom[0] !== 'function') {
      exercise.emit('fail', `expected the second app-attached middleware be a function.`)
      return ready(null, false)
    }

    try {
      const foo = {}
      const adaptor = custom[0]()
      const handler = adaptor((...args) => args)
      handler(foo)
    } catch (err) {
      exercise.emit('fail', `expected the custom middleware to provide an adaptor & handler, caught ${err.stack}`)
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', `You're a middlewizard! In the next lesson, let's use some built-in middleware!`)
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }
  }
})

module.exports = exercise
