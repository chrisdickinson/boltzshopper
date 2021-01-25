#!/usr/bin/env node

const workshopper = require('workshopper'),
      path        = require('path')

function fpath (f) {
    return path.join(__dirname, f)
}

workshopper({
    name        : 'boltzshopper',
    title       : 'Boltzmann Workshop',
    subtitle    : 'Learn how to use Boltzmann and ORMnomnom',
    appDir      : __dirname,
    menuItems   : [],
    exerciseDir : fpath('./exercises/')
})
