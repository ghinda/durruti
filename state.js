(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = global.durruti || {}, global.durruti._state = factory());
}(this, (function () { 'use strict';

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

  /* Durruti
   * Shared state between client and server.
   */

  var namespace = 'DURRUTI';

  var State = function () {
    function State() {
      classCallCheck(this, State);

      this.data = {};
    }

    createClass(State, [{
      key: 'get',
      value: function get(key) {
        if (typeof window !== 'undefined') {
          if (window[namespace]) {
            return window[namespace][key];
          } else {
            return null;
          }
        } else {
          return this.data[key];
        }
      }
    }, {
      key: 'set',
      value: function set(key, value) {
        this.data[key] = value;
      }
    }, {
      key: 'render',
      value: function render() {
        return '\n      <script>\n      ;(function(){\n        window[\'' + namespace + '\'] = ' + JSON.stringify(this.data) + '\n      }());\n      </script>\n    ';
      }
    }]);
    return State;
  }();

  return State;

})));
//# sourceMappingURL=state.js.map