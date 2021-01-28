'use strict'

const isDockerRunning = require('is-docker-running')
const workshopper = require('workshopper-exercise')
const child_process = require('child_process')
const { Client } = require('pg')
const util = require('util')
const path = require('path')
const cpr = require('cpr')
const fs = require('fs')

const exercise = workshopper()

// I just grabbed a UUID. Nothing special about it, aside from it
// being JUST SO UNIQUE. Make sure this aligns with what's in
// package.json's "sql" run script.
const DOCKER_IMAGE_NAME = 'pg-1bb8346b-2312-4cd6-a1b3-0f2ebf6d2bba'

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'selecting-data')
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

    const oready = ready
    ready = (...args) => {
      client.end()
      oready(...args)
    }
    checkserver()
  }

  async function checkserver () {
    if (exercise.args[0] === '__example') {
      return ready(null, false)
    }

    const boltzpath = path.join(path.dirname(submission), 'boltzmann.js')
    var boltzmann = null
    try {
      boltzmann = require(boltzpath)
    } catch (err) {
      exercise.emit('fail', `Could not load ${boltzpath.replace(process.cwd(), '.')} – caught ${err.stack}`)
      return ready(null, false)
    }

    var response = null
    var postgresClient = null
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/` })
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request GET / – caught ${err.stack}`)
      return ready(null, false)
    }

    const results = await client.query('select count(*) as bookcount from books')
    if (!results.rows || results.rows.length !== 1 || results.rows[0].bookcount !== '4') {
      exercise.emit('fail', `Whoa! Are you a hacker? It looks like there are more books here than we expected!`)
      return ready(null, false)
    }

    if (!response || !response.payload) {
      exercise.emit('fail', `Did not receive a response from GET /`)
      return ready(null, false)
    }

    if (response.statusCode !== 200) {
      exercise.emit('fail', `Expected a 200 OK from GET /, got ${response.statusCode} instead`)
      return ready(null, false)
    }

    var json = null
    try {
      json = response.json
    } catch (err) {
      exercise.emit('fail', `Expected a JSON response from GET /, but got the following:\n\n${response.payload}`)
      return ready(null, false)
    }

    if (!Array.isArray(json)) {
      exercise.emit('fail', `Expected an array from GET /, got ${util.format(json)} instead`)
      return ready(null, false)
    }

    if (json.length !== 3) {
      exercise.emit('fail', `Expected 3 elements from GET /, got ${json.length} instead`)
      return ready(null, false)
    }

    const titles = json.map(({title}) => title).sort()
    if (titles[0] !== 'Dirk Gently\'s Holistic Detective Agency' ||
        titles[1] !== 'Pride and Prejudice' ||
        titles[2] !== 'Small Gods') {
      exercise.emit('fail', `Expected the books returned to include "Pride and Prejudice", "Dirk Gently[...]", "Small Gods", got the following: ${util.format(json)}`)
      return ready(null, false)
    }

    // moving right along..
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/pride-and-prejudice` })
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request GET /:slug – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!response || !response.payload) {
      exercise.emit('fail', `Did not receive a response from GET /:slug`)
      return ready(null, false)
    }

    if (response.statusCode !== 200) {
      exercise.emit('fail', `Expected a 200 OK from GET /:slug, got ${response.statusCode} instead: ${response.payload}`)
      return ready(null, false)
    }

    var json = null
    try {
      json = response.json
    } catch (err) {
      exercise.emit('fail', `Expected a JSON response from GET /:slug, but got the following:\n\n${response.payload}`)
      return ready(null, false)
    }

    if (json.title !== 'Pride and Prejudice' || json.slug !== 'pride-and-prejudice' || json.author !== 'Jane Austen') {
      exercise.emit('fail', `Expected to get a specific book back from GET /:slug, but got something not quite right! Are you returning a Book instance?`)
      return ready(null, false)
    }

    var response = null
    var postgresClient = null
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/dne-dne-dne` })
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request GET /:slug – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!response || !response.payload) {
      exercise.emit('fail', `Did not receive a response from GET /:slug`)
      return ready(null, false)
    }

    if (response.statusCode !== 404) {
      exercise.emit('fail', `Expected a 404 Not Found from GET /:slug for a book that doesn't exist, got ${response.statusCode} instead`)
      return ready(null, false)
    }

    // BONUS!!
    const message = (
      mode !== 'run'
      ? `You're a middlewizard! In the next lesson, let's use some built-in middleware!`
      : 'LGTM! Run "boltzshopper verify ." to continue!'
    )

    var response = null
    var postgresClient = null
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/?name=Pratchett` })
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('pass', message)
      return ready(null, true)
    }

    if (response.statusCode !== 200) {
      exercise.emit('pass', message)
      return ready(null, true)
    }

    try {
      json = response.json
    } catch (_) { 
      exercise.emit('pass', message)
      return ready(null, true)
    }

    if (!Array.isArray(json)) {
      exercise.emit('pass', message)
      return ready(null, true)
    }

    if (json.length === 1 && json[0].title === 'Small Gods') {
      // OH MY GOD THEY DID IT
      exercise.emit('pass', message + ' ALSO YOU GOT THE BONUS ENDPOINT FILTERING WHOAAAAAAAAA. GREAT JOB')
      return ready(null, true)
    }

    exercise.emit('pass', message)
    return ready(null, false)
  }
})

module.exports = exercise
