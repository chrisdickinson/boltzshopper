'use strict'

const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'writing-handlers')
  if (!fs.existsSync(dest) && !process.cwd().includes('writing-handlers')) {
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

    const input = mode === 'run' ? 'world' : 'hello-operator-give-me-number-nine'
    var response = null
    const wrapped = boltzmann.middleware.test({})(async assert => {
      response = await assert.request({ url: `/hello/${input}` })
    })

    wrapped({}).then(() => {
      process.nextTick(() => ontest(null, { response, input }))
    }, err => {
      process.nextTick(() => ontest(err))
    })
  }

  function ontest (err, result) {
    if (err) {
      exercise.emit('fail', 'caught error when attempting to request endpoint!')
      return ready(err)
    }

    if (!result.response || !result.response.payload) {
      exercise.emit('fail', 'got an empty response from endpoint')
      return ready(null, false)
    }

    if (result.response.payload.toUpperCase() !== result.input.toUpperCase()) {
      exercise.emit('fail', `hm, got the wrong response text ("${result.response.payload}")`)
      return ready(null, false)
    }

    if (result.response.payload !== result.input.toUpperCase()) {
      exercise.emit('fail', 'got the correct response text, but in the wrong case (it should be UPPER CASE)')
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully added a new route to a Boltzmann app. You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }

    return ready(null, true)
  }
})

module.exports = exercise
