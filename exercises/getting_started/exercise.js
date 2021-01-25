'use strict'

const workshopper = require('workshopper-exercise')
const path = require('path')
const fs = require('fs')

const exercise = workshopper()

// the output will be long lines so make the comparison take that into account
exercise.longCompareOutput = true

// checks that the submission file actually exists

exercise.addProcessor((mode, ready) => {
  let submission = exercise.args[0] || process.cwd()

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
    fs.stat(submission, checkpackage)
  })

  function checkpackage (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat) {
      return ready(new Error(`Could not find package.json; tried "${submission}". Are you running boltzshopper from your solution directory?`))
    }

    if (!stat.isFile()) {
      return ready(new Error(`Found package.json, but it wasn't a file! That's pretty strange!`))
    }

    const contents = JSON.parse(fs.readFileSync(submission, 'utf8'))

    if (!contents.boltzmann) {
      exercise.emit('fail', 'Whoops, you might have run `npx boltzmann` or `npm init`. Try `npx boltzmann-cli .`!')
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully upgraded a Boltzmann app. You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }

    return ready(null, true)
  }
})

module.exports = exercise
