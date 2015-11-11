#!/usr/bin/env node

'use strict'

const path = require('path')
const Metalsmith = require('metalsmith')
const layouts = require('metalsmith-layouts')
const markdown = require('metalsmith-markdown')
const dir = path.join(__dirname, '..')


function build(done){
  const metalsmith = Metalsmith(dir)

  metalsmith
    .source(path.join(dir, 'content'))
    .use(markdown())
    .use(layouts({
      engine: 'handlebars',
      pattern: '**/*.html'
    }))
    .destination(path.join(dir, 'dist'))
    .build(err => {
      if (err) {
        throw err
      }
      done && done()
    })
}

build()

module.exports = build
