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
const DOCKER_IMAGE_NAME = 'pg-7f84e47c-ef83-4468-bbf5-8aff8b546f2b'

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'mutating-data')
  
  if (!fs.existsSync(dest) && !process.cwd().includes('mutating-data')) {
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

    const oready = ready
    ready = (...args) => {
      client.end()
      oready(...args)
    }
    checkserver()
  }

  async function checkserver () {
    if (exercise.args[0] === '._boltzshopper') {
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

    // create:
    // - [x] 409 on duplicate book
    // - [x] 201 on new book; check location header; check book in db
    // update:
    // - [x] 404 on book not found
    // - [x] 200 ok book updated (update the pratchett book)
    //   - verify that the pratchett book changed inside the test
    // delete:
    // - [x] 404 on book not found
    // - [x] 204 on book deleted; verify book is gone

    var response = null
    // ------

    var postgresClient = null
    var success = true
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/`, method: 'POST', payload: {
        author: 'wow',
        title: 'small gods',
        published: 1998
      }})
      if (response.statusCode !== 409) {
        exercise.emit('fail', `Trying to create a book whose slug is taken should 409`)
        success = false
        return
      }

      response = await assert.request({ url: `/`, method: 'POST', payload: {
        author: 'Kim Stanley Robinson',
        title: 'Aurora A Novel',
        published: 2015
      }})
      if (response.statusCode !== 201) {
        exercise.emit('fail', `A successfully created book should return 201`)
        success = false
        return
      }

      if (response.headers.location !== '/aurora-a-novel') {
        exercise.emit('fail', `A successfully created book should return a valid Location header; got "${response.headers.location}" (does it start with "/"?)`)
        success = false
        return
      }

      const query = await postgresClient.query(`select * from books where slug = 'aurora-a-novel'`)
      if (query.rows.length < 1) {
        exercise.emit('fail', `The new novel should be saved to the database.`)
        success = false
        return
      }

      if (query.rows[0].title !== 'Aurora A Novel') {
        exercise.emit('fail', `It looks like the book we were trying to create wasn't saved successfully.`)
        success = false
        return
      }

      try {
        if (response.json.title !== 'Aurora A Novel' || response.json.author !== 'Kim Stanley Robinson') {
          exercise.emit('fail', `Successfully creating a book should return the book as json`)
          success = false
          return
        }
      } catch (err) {
        exercise.emit('fail', `The create book endpoint should return JSON, got "${response.payload}" instead`)
        success = false
        return
      }
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request POST / – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!success) {
      return ready(null, false)
    }

    var postgresClient = null
    var success = true
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/not-a-book-but-ok`, method: 'POST', payload: {
        author: 'wow'
      }})
      if (response.statusCode !== 404) {
        exercise.emit('fail', `Trying to update a book that does not exist should 404`)
        success = false
        return
      }

      response = await assert.request({ url: `/small-gods`, method: 'POST', payload: {
        author: 'GNU/Terry Pratchett'
      }})
      if (response.statusCode !== 200) {
        exercise.emit('fail', `A successfully updated book should return 200`)
        success = false
        return
      }

      const query = await postgresClient.query(`select author from books where slug = 'small-gods'`)
      if (query.rows.length < 1) {
        exercise.emit('fail', `It looks like the book we were trying to update was deleted somehow.`)
        success = false
        return
      }

      if (query.rows[0].author !== 'GNU/Terry Pratchett') {
        exercise.emit('fail', `It looks like the book we were trying to update didn't get updated.`)
        success = false
        return
      }

      try {
        if (response.json.title !== 'Small Gods' || response.json.author !== 'GNU/Terry Pratchett') {
          exercise.emit('fail', `Successfully updating the book should return the updated book`)
          success = false
          return
        }
      } catch (err) {
        exercise.emit('fail', `The update book endpoint should return JSON, got "${response.payload}" instead`)
        success = false
        return
      }
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request POST /:slug – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!success) {
      return ready(null, false)
    }

    // ------

    var postgresClient = null
    var success = true
    var wrapped = boltzmann.middleware.test({
      after: () => {}
    })(async assert => {
      postgresClient = assert.postgresClient
      response = await assert.request({ url: `/dne-dne-dne`, method: 'DELETE' })
      if (response.statusCode !== 404) {
        exercise.emit('fail', `Trying to delete a book that does not exist should 404`)
        success = false
        return
      }

      response = await assert.request({ url: `/pride-and-prejudice`, method: 'DELETE' })
      if (response.statusCode !== 204) {
        exercise.emit('fail', `A successfully deleted book should return 204`)
        success = false
        return
      }

      const query = await postgresClient.query(`select * from books where slug = 'pride-and-prejudice'`)
      if (query.rows.length > 0) {
        exercise.emit('fail', `The novel should be deleted from the database.`)
        success = false
        return
      }
    })

    if (postgresClient) {
      postgresClient.end()
    }

    try {
      await wrapped({})
    } catch (err) {
      exercise.emit('fail', `Could not request POST / – caught ${err.stack}`)
      return ready(null, false)
    }

    if (!success) {
      return ready(null, false)
    }

    if (mode !== 'run') {
      exercise.emit('pass', 'Great work! You\'ve mutated the database! You\'re ready for the next lesson!')
    } else {
      exercise.emit('pass', 'LGTM! Run "boltzshopper verify ." to continue!')
    }
    return ready(null, success)
  }
})

module.exports = exercise
