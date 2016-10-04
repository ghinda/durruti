'use strict';
var path = require('path')
var babel = require('rollup-plugin-babel')

var LIVERELOAD_PORT = 35729

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks)

  grunt.initConfig({
    watch: {
      grunt: {
        files: [ 'Gruntfile.js' ]
      },
      livereload: {
        options: {
          livereload: LIVERELOAD_PORT
        },
        files: [
          '{,test/**/,./}*.js'
        ]
      },
      js: {
        files: [
          'src/{,*/}*.js'
        ],
        tasks: [
          'rollup'
        ]
      }
    },
    connect: {
      options: {
        port: 9000,
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          livereload: true,
          base: [
            './'
          ]
        }
      },
      test: {
        options: {
          base: './'
        }
      }
    },
    standard: {
      options: {
        parser: 'babel-eslint'
      },
      server: {
        src: [
          '{src,test}/**/*.js'
        ]
      }
    },
    rollup: {
      options: {
        sourceMap: true,
        plugins: [
          babel({
            exclude: 'node_modules/**'
          })
        ],
        format: 'umd',
        globals: {
          fs: 'fs',
          http: 'http',
          mkdirp: 'mkdirp'
        }
      },
      durruti: {
        options: {
          moduleName: 'durruti'
        },
        src: [ 'src/durruti.js' ],
        dest: 'durruti.js'
      },
      store: {
        options: {
          moduleName: 'durruti.Store'
        },
        src: [ 'src/store.js' ],
        dest: 'store.js'
      },
      static: {
        options: {
          format: 'cjs'
        },
        src: [ 'src/static.js' ],
        dest: 'static.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'durruti.min.js': 'durruti.js',
          'store.min.js': 'store.js'
        }
      }
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          require: [
            function () {
              var chai = require('chai')
              global.expect = chai.expect

              global.durruti = require('./durruti')
            }
          ]
        },
        src: [
          'test/{server,shared}/**/*.js',
        ]
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          urls: [
            'http://127.0.0.1:9000/test/client'
          ],
          detailedError: true,
          browsers: [
            {
              browserName: 'chrome',
              platform: 'Linux'
            }, {
              browserName: 'firefox',
              platform: 'Linux'
            }, {
              browserName: 'android',
              platform: 'Linux',
              version: '4.4'
            }, {
              browserName: 'internet explorer',
              platform: 'Windows 7',
              version: '9.0'
            }, {
              browserName: 'internet explorer',
              platform: 'Windows 8',
              version: '10.0'
            }, {
              browserName: 'internet explorer',
              platform: 'Windows 10',
              version: '11.0'
            }, {
              browserName: 'safari',
              platform: 'OS X 10.11',
              version: '9.0'
            }, {
              browserName: 'iphone',
              platform: 'OS X 10.10',
              version: '9.2'
            }
          ]
        }
      }
    },
    clean: {
      site: {
        src: [
          './durruti.*',
          './store.*',
          './static.*'
        ]
      }
    }
  })

  grunt.registerTask('server', function (target) {
    if (target === 'dist') {
      return grunt.task.run([
        'default',
        'connect:dist:keepalive'
      ])
    }

    grunt.task.run([
      'default',
      'connect:livereload',
      'watch'
    ])
  })

  grunt.registerTask('test', [
    'default',
    'connect:test',
    'mochaTest',
    'saucelabs-mocha'
  ])

  grunt.registerTask('default', [
    'clean',
    'standard',
    'rollup',
    'uglify'
  ])
}
