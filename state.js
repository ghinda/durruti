(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = global.durruti || {}, global.durruti.state = factory());
}(this, function () { 'use strict';

  /* Durruti
   * Shared state between client and server.
   */

  var namespace = 'DURRUTI';

  function State() {
    var data = {};

    function get(key) {
      if (typeof window !== 'undefined') {
        if (window[namespace]) {
          return window[namespace][key];
        } else {
          return null;
        }
      } else {
        return data[key];
      }
    }

    function set(key, value) {
      data[key] = value;
    }

    function render() {
      return '\n      ;(function(){\n        window[\'' + namespace + '\'] = JSON.parse(\'' + JSON.stringify(data) + '\')\n      }());\n    ';
    }

    return {
      get: get,
      set: set,
      render: render
    };
  }

  var state = State();

  return state;

}));
//# sourceMappingURL=state.js.map