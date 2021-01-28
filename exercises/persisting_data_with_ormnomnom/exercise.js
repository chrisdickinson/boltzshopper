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
const DOCKER_IMAGE_NAME = 'pg-1bb8346b-2312-4cd6-a1b3-0f2ebf6d2bba'

exercise.addPrepare(ready => {
  const dest = path.join(process.cwd(), 'persisting-data')
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

    let error = null
    for (const attempt of [0, 1, 2, 3]) {
      await new Promise(resolve => setTimeout(resolve, 500 * attempt))

      try {
        client = new Client({ connectionString: `postgres://postgres:postgres@127.0.0.1:${pgport}/postgres` })
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

    checkserver()
  }

  function checkserver () {
    client.end()

    return ready(null, true)
  }
})

module.exports = exercise
