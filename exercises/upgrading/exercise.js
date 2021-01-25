'use strict'

const workshopper = require('workshopper-exercise')
const path = require('path')
const fs = require('fs')

const exercise = workshopper()

// the output will be long lines so make the comparison take that into account
exercise.longCompareOutput = true

// checks that the submission file actually exists

exercise.addProcessor((mode, callback) => {
  let submission = exercise.args[0] || process.cwd()

  fs.stat(submission, (err, stat) => {
    if ((err && err.code == 'ENOENT') || !stat) {
      return callback(new Error('No such file or directory: ' + submission))
    }

    if (err) {
      return callback(err)
    }

    if (stat.isFile()) {
      submission = path.dirname(submission)
    }

    submission = path.join(submission, 'package.json')
    fs.stat(submission, checkpackage)
  })

  function checkpackage (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat) {
      return callback(new Error(`Could not find package.json; tried "${submission}". Are you running boltzshopper from your solution directory?`))
    }

    if (!stat.isFile()) {
      return callback(new Error(`Found package.json, but it wasn't a file! That's pretty strange!`))
    }

    const contents = JSON.parse(fs.readFileSync(submission, 'utf8'))

    if (!contents.boltzmann) {
      return callback(new Error('Whoops, you might have run `npx boltzmann` or `npm init`. Try `npx boltzmann-cli .`!'))
    }

    return callback(null, 'Great work! This looks like a boltzmann project. Make another directory and run boltzshopper to start the next lesson!')
  }
})

module.exports = exercise
