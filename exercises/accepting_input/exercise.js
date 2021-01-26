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
  cpr(path.join(__dirname, 'scaffold'), dest, install)

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

    var pratchett = null
    var mikeFord = null
    var badOmens = null

    const getPratchettWrapped = boltzmann.middleware.test({})(async assert => {
      pratchett = await assert.request({ url: '/books/book/e1edac325ddd67fb8c3e1b1ac244f3a8' })
    })
    const addBookWrapped = boltzmann.middleware.test({})(async assert => {
      mikeFord = await assert.request({
        url: '/headers',
        method: 'POST',
        payload: { title: 'The Final Reflection', author: 'John M. Ford', year: 1984 }
     })
    })
    const addBadWrapped = boltzmann.middleware.test({})(async assert => {
      badOmens = await assert.request({
        url: '/headers',
        method: 'POST',
        payload: { title: 'Good Omens', year: 1990 }
     })
    })

    Promise.all([getPratchettWrapped({}), addBookWrapped({}), addBadWrapped({})]).then(() => {
      process.nextTick(() => evaluateResults(null, pratchett, mikeFord, badOmens))
    }, err => {
      process.nextTick(() => evaluateResults(err))
    })
  }

  function evaluateBoth (err, pratchett, mikeFord, badOmens) {
    if (err) {
      exercise.emit('fail', 'caught error when attempting to request endpoint!')
      return ready(err)
    }

    if (pratchett.statusCode !== 200) {
      exercise.emit('fail', `The bookByID() handler responded with status code ${pratchett.statusCode}, not the requested book!`)
      return ready(null, false)
    }

    if (JSON.parse(pratchett).title !== 'Small Gods') {
      exercise.emit('fail', `The bookByID() handler responded with the wrong book!`)
      return ready(null, false)
    }

    if (mikeFord.statusCode !== 200) {
      exercise.emit('fail', `The addBook() handler responded with status code ${mikeFord.statusCode} to a perfectly reasonable new book.`)
      return ready(null, false)
    }

    if (mikeFord.payload !== '343e9802b5785bc15359c9ac2c0e4d88') {
      exercise.emit('fail', `The addBook() handler responded with an unexpected ID for the book: ${mikeFord.payload}`)
      return ready(null, false)
    }

    // validate that bad input is rejected


    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully accepted and validated input. You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }

    return ready(null, true)
  }
})

module.exports = exercise
