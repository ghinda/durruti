(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fs'), require('http'), require('mkdirp')) :
  typeof define === 'function' && define.amd ? define(['fs', 'http', 'mkdirp'], factory) :
  (global.durruti = global.durruti || {}, global.durruti.static = factory(global.fs,global.http,global.mkdirp));
}(this, function (fs,http,mkdirp) { 'use strict';

  fs = 'default' in fs ? fs['default'] : fs;
  http = 'default' in http ? http['default'] : http;
  mkdirp = 'default' in mkdirp ? mkdirp['default'] : mkdirp;

  /* Durruti
   * Utils.
   */

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // one-level object extend
  function extend(obj, defaults) {
    if (obj === null) {
      obj = {};
    }

    // clone object
    var extended = clone(obj);

    // copy default keys where undefined
    Object.keys(defaults).forEach(function (key) {
      if (typeof extended[key] !== 'undefined') {
        extended[key] = obj[key];
      } else {
        extended[key] = defaults[key];
      }
    });

    return extended;
  }

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function fetch(params, callback) {
    params = extend(params, {
      host: 'localhost',
      port: 3000,
      path: '/'
    });

    var req = http.request({
      host: params.host,
      port: params.port,
      path: params.path,
      method: 'GET'
    }, function (res) {
      var page = '';
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        page += chunk;
      });

      res.on('end', function () {
        callback(null, page);
      });
    });

    req.end();
  }

  function write(params, callback) {
    params = extend(params, {
      dir: './static'
    });

    var path = params.dir;

    // check last char, to always end with /
    if (path.slice(-1) !== '/') {
      path += '/';
    }

    // check first chart, to never start with /
    if (params.path[0] === '/') {
      // remove the first char
      params.path = params.path.slice(1);
    }

    path += params.path;

    // split path into fragments
    var pathFragments = path.split('/');
    var file = pathFragments[pathFragments.length - 1];

    if (file.indexOf('.') !== -1) {
      // has file extension, remove the last fragment
      pathFragments.pop();
    } else {
      // doesn't have an extension
      // check last char, to always end with /
      if (path.slice(-1) !== '/') {
        path += '/';
      }

      // add index.html
      path += 'index.html';
    }

    // create nested folders
    mkdirp.sync(pathFragments.join('/'));

    fs.writeFile(path, params.content, function (err) {
      if (err) {
        return console.log(err);
      }

      callback(err, path);
    });
  }

  function writePage(params) {
    return new Promise(function (resolve, reject) {
      fetch(params, function (err, res) {
        if (err) {
          return reject(err);
        }

        params = extend(params, {
          content: res
        });

        write(params, function (err, res) {
          if (err) {
            return reject(err);
          }

          resolve(res);
        });
      });
    });
  }

  var Static = function () {
    function Static() {
      classCallCheck(this, Static);
    }

    createClass(Static, [{
      key: 'render',
      value: function render(params, callback) {
        Promise.all(params.pages.map(function (page) {
          var options = extend(params, {
            path: page
          });

          return writePage(options);
        })).then(function (pages) {
          var message = 'Rendered pages: \n * ' + pages.join('\n * ');

          console.log(message);

          callback();
        });
      }
    }]);
    return Static;
  }();

  var _static = new Static();

  return _static;

}));
//# sourceMappingURL=static.js.map