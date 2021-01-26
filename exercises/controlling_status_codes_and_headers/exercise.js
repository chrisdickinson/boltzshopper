'use strict'

const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')
const { headers } = require('./scaffold/handlers')

const exercise = workshopper()

// XXX literally just copy-pasted from the last lesson; delete at WILL

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'http-metadata')
  if (!fs.existsSync(dest)) {
    cpr(path.join(__dirname, 'scaffold'), dest, install)
  } else {
    ready()
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
    fs.stat(submission, checkhandlers)
  })

  function checkhandlers (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat) {
      return ready(new Error(`Could not find package.json; tried "${submission}". Are you running boltzshopper from your solution directory?`))
    }

    if (!stat.isFile()) {
      return ready(new Error(`Found package.json, but it wasn't a file! That's pretty strange!`))
    }

    const boltzpath = path.join(path.dirname(submission), 'boltzmann.js')
    var boltzmann = null
    try {
      boltzmann = require(boltzpath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${boltzpath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    var thrower = null
    var headerer = null
    const wrappedThrow = boltzmann.middleware.test({})(async assert => {
      thrower = await assert.request({ url: '/throws' })
    })
    const wrappedHeaders = boltzmann.middleware.test({})(async assert => {
      headerer = await assert.request({ url: '/headers' })
    })

    Promise.all([wrappedThrow({}), wrappedHeaders({})]).then(() => {
      process.nextTick(() => evaluateBoth(null, thrower, headerer))
    }, err => {
      process.nextTick(() => evaluateBoth(err))
    })
  }

  function evaluateBoth (err, thrower, hasHeaders) {
    if (err) {
      exercise.emit('fail', 'caught error when attempting to request endpoint!')
      return ready(err)
    }

    if (thrower.statusCode !== 418) {
      exercise.emit('fail', `The throws() handler responded with status code ${thrower.statusCode}, not the requested 418!`)
      return ready(null, false)
    }

    if (hasHeaders.statusCode !== 203) {
      exercise.emit('fail', `The headers() handler responded with status code ${hasHeaders.statusCode}, not the requested 203!`)
      return ready(null, false)
    }

    // let's not get fussy about what's in the header, just that it's set
    if (!hasHeaders.headers['wow-great-header']) {
      exercise.emit('fail', `The headers() handler did not set the \`wow-great-header\` header.`)
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully used symbols to add metadata to a Boltzmann response. You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }

    return ready(null, true)
  }
})

module.exports = exercise
