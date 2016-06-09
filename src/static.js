/* Durruti
 * Static site generator.
 */

import fs from 'fs'
import http from 'http'
import mkdirp from 'mkdirp'
import * as util from './util'

function fetch (params, callback) {
  params = util.extend(params, {
    host: 'localhost',
    port: 3000,
    path: '/'
  })

  var req = http.request({
    host: params.host,
    port: params.port,
    path: params.path,
    method: 'GET'
  }, function (res) {
    var page = ''
    res.setEncoding('utf8')
    res.on('data', function (chunk) {
      page += chunk
    })

    res.on('end', function () {
      callback(null, page)
    })
  })

  req.end()
}

function write (params, callback) {
  params = util.extend(params, {
    dir: './static'
  })

  var path = params.dir

  // check last char, to always end with /
  if (path.slice(-1) !== '/') {
    path += '/'
  }

  // check first chart, to never start with /
  if (params.path[0] === '/') {
    // remove the first char
    params.path = params.path.slice(1)
  }

  path += params.path

  // split path into fragments
  var pathFragments = path.split('/')
  var file = pathFragments[pathFragments.length - 1]

  if (file.indexOf('.') !== -1) {
    // has file extension, remove the last fragment
    pathFragments.pop()
  } else {
    // doesn't have an extension
    // check last char, to always end with /
    if (path.slice(-1) !== '/') {
      path += '/'
    }

    // add index.html
    path += 'index.html'
  }

  // create nested folders
  mkdirp.sync(pathFragments.join('/'))

  fs.writeFile(path, params.content, function (err) {
    if (err) {
      return console.log(err)
    }

    callback(err, path)
  })
}

function writePage (params) {
  return new Promise(function (resolve, reject) {
    fetch(params, function (err, res) {
      if (err) {
        return reject(err)
      }

      params = util.extend(params, {
        content: res
      })

      write(params, function (err, res) {
        if (err) {
          return reject(err)
        }

        resolve(res)
      })
    })
  })
}

function render (params, callback) {
  Promise.all(params.pages.map(function (page) {
    var options = util.extend(params, {
      path: page
    })

    return writePage(options)
  }))
  .then(function (pages) {
    var message = 'Rendered pages: \n * '
    message += pages.join('\n * ')

    console.log(message)

    callback()
  })
}

function Static () {
  this.render = render
}

export default new Static()
