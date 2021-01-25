'use strict'

const workshopper = require('workshopper-exercise')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

// the output will be long lines so make the comparison take that into account
exercise.longCompareOutput = true

// checks that the submission file actually exists
exercise.addPrepare(ready => {
  cpr(path.join(__dirname, 'scaffold'), path.join(process.cwd(), 'upgrading'), ready)
})

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
      return ready(new Error('Whoops, you might have run `npx boltzmann` or `npm init`. Try `npx boltzmann-cli .`!'))
    }

    if (contents.boltzmann.version === '0.3.0') {
      return ready(new Error('It looks like you haven\'t run the upgrade command: this Boltzmann app is on 0.3.0 when newer versions are available.'))
    }

    if (!contents.boltzmann.jwt) {
      return ready(new Error('Whoops, you didn\'t turn on the JWT feature. Rerun the upgrade command with "--jwt"!'))
    }

    if (contents.boltzmann.status) {
      return ready(new Error('Whoops, you didn\'t turn off the status feature. Rerun the upgrade command with "--status=off"!'))
    }

    if (mode !== 'run') {
      console.log('Great work! You\'ve successfully upgraded a Boltzmann app. You\'re ready for the next lesson!')
    }
    return ready()
  }
})

module.exports = exercise
