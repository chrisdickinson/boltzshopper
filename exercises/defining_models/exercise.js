'use strict'

const isDockerRunning = require('is-docker-running')
const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const { Client } = require('pg')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

// I just grabbed a UUID. Nothing special about it, aside from it
// being JUST SO UNIQUE
const DOCKER_IMAGE_NAME = 'pg-abe02ac5-f9c2-4960-a5e6-ddfa46d63bcb'

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'defining-models')
  if (!fs.existsSync(dest) && !process.cwd().includes('defining-models')) {
    cpr(path.join(__dirname, 'scaffold'), dest, install)
  } else {
    ready()
  }

  function install(err) {
    if (err) {
      return ready(err)
    }

    fs.writeFileSync(path.join(dest, '._boltzshopper'), '', 'utf8')
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
  let pgport = null
  let client = null

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
    fs.stat(submission, checkdocker)
  })

  async function checkdocker (err, stat) {
    if ((err && err.code == 'ENOENT') || !stat) {
      return ready(new Error(`Could not find package.json; tried "${submission}". Are you running boltzshopper from your solution directory?`))
    }

    if (!stat.isFile()) {
      return ready(new Error(`Found package.json, but it wasn't a file! That's pretty strange!`))
    }

    // twofold check here: make sure docker is running, and see if our
    // container is running. if it's running, remove it and recreate it.
    try {
      const isRunning = await isDockerRunning.findContainerByName(DOCKER_IMAGE_NAME)
      if (isRunning) {
        const proc = child_process.spawn('docker', [
          'rm',
          '-f',
          DOCKER_IMAGE_NAME
        ]);

        if (process.env.DEBUG) {
          proc.stdout.pipe(process.stdout, {end: false})
          proc.stderr.pipe(process.stderr, {end: false})
        }

        return proc.on('exit', () => rundocker())
      }
    } catch (err) {
      return ready(new Error(`Is docker installed and running? If not, grab it from https://www.docker.com/products/docker-desktop`))
    }

    return rundocker()
  }

  function rundocker() {
    const proc = child_process.spawn('docker', [
      'run',
      '-d',
      '--name',
      DOCKER_IMAGE_NAME,
      '-e',
      'POSTGRES_USER=postgres',
      '-e',
      'POSTGRES_PASSWORD=postgres',
      '-p',
      '0:5432',
      'postgres:13.1-alpine'
    ])

    if (process.env.DEBUG) {
      proc.stdout.pipe(process.stdout, {end: false})
      proc.stderr.pipe(process.stderr, {end: false})
    }

    return proc.on('exit', code => {
      if (code !== 0) {
        return ready(new Error(`Caught error running postgres. Is docker installed and running? If not, grab it from https://www.docker.com/products/docker-desktop`))
      }

      getpgport()
    })
  }

  function getpgport () {
    const proc = child_process.spawn('docker', [
      'port',
      DOCKER_IMAGE_NAME
    ])
    const acc = []
    proc.stdout.on('data', data => acc.push(data))
    proc.on('exit', code => {
      if (code !== 0) {
        return ready(new Error('could not find pgport'))
      }

      const output = Buffer.concat(acc).toString()
      try {
        pgport = output.split('->').slice(-1)[0].trim().split(':').slice(-1)[0].trim()
      } catch (err) {
        return ready(new Error(`"docker port" output in unexpected format: ${output}`))
      }

      migrate()
    })
  }

  async function migrate () {
    const fixture = fs.readFileSync(path.join(__dirname, 'fixture.sql'), 'utf8')

    const connectionString = `postgres://postgres:postgres@127.0.0.1:${pgport}/postgres`
    let error = null
    for (const attempt of [0, 1, 2, 3]) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))

      try {
        client = new Client({ connectionString })
        await client.connect()
      } catch (err) {
        error = err
      }
    }

    if (!client) {
      return ready(error)
    }

    try {
      await client.query(fixture)
    } catch (err) {
      return ready(err)
    }

    fs.writeFileSync(path.join(path.dirname(submission), '.env'), `PGURL="${connectionString}"`)
    process.env.PGURL = connectionString

    client.end()
    checkserver()
  }

  async function checkserver () {
    if (exercise.args[0] === '._boltzshopper') {
      return ready(null, false)
    }

    function cleanup(err, okay) {
      if (pgClient) {
        pgClient.end()
      }
      ready(err, okay)
    }

    const boltzpath = path.join(path.dirname(submission), 'boltzmann.js')
    var boltzmann = null
    try {
      boltzmann = require(boltzpath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${boltzpath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return cleanup(null, false)
    }

    var response = null
    var pgClient = null
    const wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      pgClient = assert.pgClient
      response = await assert.request({ url: `/books` })
    })

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request GET /books – caught ${err.stack}`)
      return cleanup(null, false)
    }

    if (response.statusCode !== 200) {
      exercise.emit('fail', `/books did not respond with 200; got ${response.statusCode}; ${response.payload}`)
      return cleanup(null, false)
    }

    var books
    try {
      books = JSON.parse(response.payload)
    } catch (err) {
      exercise.emit('fail', `/books did not respond with valid json – caught ${err.stack}`)
      return cleanup(null, false)
    }

    if (!Array.isArray(books) || !books.length === 4) {
      exercise.emit('fail', `/books did not respond with the expected 4 books! got ${JSON.stringify(books)}`)
      return cleanup(null, false)
    }

    if (!books[0].title) {
      exercise.emit('fail', `Make sure you're including the title field in the value set returned by your query.`)
      return cleanup(null, false)
    }

    if (!books[0].author || !books[0].author.name) {
      exercise.emit('fail', `Next modify your query so you include the author names along with the book data.`)
      return cleanup(null, false)
    }

    if (books[0].author.name !== 'Donald Knuth') {
      exercise.emit('fail', `Now sort the query by author name!`)
      return cleanup(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve successfully defined two related models, joined, and ordered! You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }
    return cleanup(null, true)
  }
})

module.exports = exercise
