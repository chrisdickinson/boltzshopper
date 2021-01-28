# boltzmann + ormnomnom syllabus

## pt 1: boltzmann

- [x] scaffolding
  - start with empty dir
  - check that boltzmann.js exists and runs
- [x] upgrading / adding flags
  - start with an existing installation
  - turn on status endpoint
  - check that status is enabled
- [x] writing a handler
  - add an endpoint that accepts "/hi/:there" and responds "hi {there}"
  - check that 2-3 random words work
- [x] controlling status codes and headers
  - you have two endpoints: one that throws an error, and one that
    returns a stream
  - make the error a 418, and make the stream return a 203 with a
    "x-clacks-overhead: gnu/terry pratchett" header.
- [x] writing a basic middleware
- [x] attaching middleware
- [x] accepting input
  - add an endpoint that accepts body input
  - check that valid json is available

## pt 2: ormnomnom

- [ ] selecting objects -- CD
- [ ] defining a model -- CJ
- [ ] selecting using joins
- [ ] inserting rows
- [ ] updating rows
- [ ] aggregates
- [ ] annotation
