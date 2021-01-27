'use strict'

const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')
const { headers } = require('./scaffold/handlers')

const exercise = workshopper()

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'accepting-input')
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

    const results = {}
    const getPratchettWrapped = boltzmann.middleware.test({})(async assert => {
      results.pratchett = await assert.request({ url: '/books/book/e1edac325ddd67fb8c3e1b1ac244f3a8' })
    })
    const filteredWrapped = boltzmann.middleware.test({})(async assert => {
      results.filtered = await assert.request({ url: '/books?genre=satire' })
    })
    const addBookWrapped = boltzmann.middleware.test({})(async assert => {
      results.mikeFord = await assert.request({
        url: '/books',
        method: 'POST',
        payload: { title: 'The Final Reflection', author: 'John M. Ford', year: 1984 }
     })
    })
    const addBadWrapped = boltzmann.middleware.test({})(async assert => {
      results.badOmens = await assert.request({
        url: '/books',
        method: 'POST',
        payload: { title: 'Good Omens', year: 1990 }
     })
    })

    Promise.all([
      getPratchettWrapped({}),
      addBookWrapped({}),
      addBadWrapped({}),
      filteredWrapped({})
    ]).then(() => {
      process.nextTick(() => evaluateResults(null, results))
    }, err => {
      process.nextTick(() => evaluateResults(err))
    })
  }

  function evaluateResults (err, results) {
    if (err) {
      exercise.emit('fail', 'caught error when attempting to request endpoint!')
      return ready(err)
    }

    if (results.pratchett.statusCode !== 200) {
      exercise.emit('fail', `The bookByID() handler responded with status code ${results.pratchett.statusCode}, not the requested book!`)
      return ready(null, false)
    }

    if (JSON.parse(results.pratchett.payload).title !== 'Small Gods') {
      exercise.emit('fail', `The bookByID() handler responded with the wrong book!`)
      return ready(null, false)
    }

    const expectOne = JSON.parse(results.filtered.payload)
    if (!Array.isArray(expectOne) || expectOne.length !== 1) {
      exercise.emit('fail', `Expected an array response to our filtered query. Got ${expectOne} instead`)
      return ready(null, false)
    }

    if (expectOne.length < 1 || expectOne[0].title !== 'Pride and Prejudice') {
      exercise.emit('fail', `Expected to get P&P back from our filtered query! Got ${expectOne} instead`)
      return ready(null, false)
    }

    if (!results.mikeFord.payload) {
      exercise.emit('fail', `The addBook() handler did not respond with an id for the new book!`)
      return ready(null, false)
    }

    if (results.mikeFord.payload !== '343e9802b5785bc15359c9ac2c0e4d88') {
      exercise.emit('fail', `The addBook() handler responded with an unexpected ID for the book: ${results.mikeFord.payload}`)
      return ready(null, false)
    }

    if (results.mikeFord.statusCode !== 200) {
      exercise.emit('fail', `The addBook() handler responded with status code ${results.mikeFord.statusCode} to a perfectly reasonable new book.`)
      return ready(null, false)
    }

    if (results.badOmens.statusCode !== 400) {
      exercise.emit('fail', `The addBook() handler responded with status code ${results.badOmens.statusCode} to bad input; expected 400.`)
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully accepted and validated input. You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }

    return ready(null, true)
  }
})

module.exports = exercise
