'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({ port: LIVERELOAD_PORT })
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir))
};
var babel = require('rollup-plugin-babel')

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
          'build/{,*/}*.html',
          '{,site/**/}*.css',
          '{,test/**/,site/**/}*.js'
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
            './site/',
            './build',
            './'
          ]
        }
      },
      dist: {
        options: {
          base: './build'
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
          '{src,test}/{,*/}*.js'
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
        format: 'umd'
      },
      core: {
        options: {
          moduleName: 'Durruti'
        },
        files: {
          src: 'src/durruti.js',
          dest: 'durruti.js'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'durruti.min.js': 'durruti.js'
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          urls: [
            'http://127.0.0.1:9000/test'
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
              version: '5.1'
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
          'build/',
          './durruti.*'
        ]
      }
    },
    copy: {
      site: {
        files: [
          {
            expand: true,
            cwd: 'site/',
            src: [
              '**/*',
              '!**/*.{hbs,md}'
            ],
            dest: 'build/'
          },
          {
            expand: true,
            src: [
              'bower_components/**/*'
            ],
            dest: 'build/'
          },
          {
            expand: true,
            src: [
              'build/**/*'
            ],
            dest: 'build/'
          },
          {
            expand: true,
            src: [
              'durruti*'
            ],
            dest: 'build/'
          }
        ]
      }
    },
    buildcontrol: {
      options: {
        dir: 'build',
        commit: true,
        push: true
      },
      site: {
        options: {
          remote: 'git@github.com:ghinda/durruti.git',
          branch: 'gh-pages'
        }
      }
    }
  })

  grunt.registerTask('server', function (target) {
    if (target === 'dist') {
      return grunt.task.run([
        'default',
        'copy',
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
    'saucelabs-mocha'
  ])

  grunt.registerTask('default', [
    'clean',
    'standard',
    'rollup',
    'uglify'
  ])

  grunt.registerTask('deploy', [
    'test',
    'copy',
    'buildcontrol'
  ])
}
