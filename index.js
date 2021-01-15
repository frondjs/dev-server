#!/usr/bin/env node

const path = require('path')
const pkg = require('./package.json')
const scriptName = Object.keys(pkg.bin)[0]

// context
const cwd = process.cwd()
const pkgname = pkg.name.indexOf('/') === -1 ? pkg.name : pkg.name.split('/')[1]
const ctx = {
  framework: {
    path: path.join(__dirname),
    name: pkgname
  },
  project: {
    path: cwd,
    name: cwd.split('/').reverse()[0]
  }
}

require('yargs')
  .scriptName(scriptName)
  .usage(`${scriptName} <cmd> [args]`)
  .config({ctx: ctx})
  .command('start', 'Starts a server.', (yargs) => {
    yargs.positional('publicpath', {
      type: 'string',
      default: 'build',
      describe: 'The server will serve all of the files under this directory.',
      normalize: true
    })

    yargs.positional('port', {
      type: 'number',
      default: 8080,
      describe: 'The server will be accessible through this port.',
    })

    yargs.positional('silent', {
      type: 'boolean',
      default: false,
      describe: 'Don\'t stdout.',
    })

    yargs.positional('watch', {
      type: 'string',
      default: false,
      describe: 'The app will rebuild itself on codebase change if set.'
    })
  }, function (argv) {
    require('./initServer')(argv)
  })
  .help()
  .argv
