(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = global.durruti || {}, global.durruti.Store = factory());
}(this, function () { 'use strict';

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

  var data = {};

  var State = function () {
    function State() {
      classCallCheck(this, State);
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
          return data[key];
        }
      }
    }, {
      key: 'set',
      value: function set(key, value) {
        data[key] = value;
      }
    }, {
      key: 'render',
      value: function render() {
        return '\n      ;(function(){\n        window[\'' + namespace + '\'] = JSON.parse(\'' + JSON.stringify(data) + '\')\n      }());\n    ';
      }
    }]);
    return State;
  }();

  var state = new State();

  /* Durruti
   * Utils.
   */

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // one-level object extend
  function extend() {
    var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var defaults = arguments[1];

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

  function Store(name, options) {
    options = options || {};

    var historySupport = false;
    // history is active only in the browser, by default
    if (typeof window !== 'undefined') {
      historySupport = true;
    }

    this.options = extend(options, {
      history: historySupport
    });

    this.events = {
      change: []
    };

    this.data = [];

    // if a store name is defined, share state
    if (name) {
      // check if any data in sharedState
      var stateValue = state.get(name);
      if (stateValue) {
        this.data.push(stateValue);
      }

      var self = this;

      // save data to shared state
      this.on('change', function () {
        state.set(name, self.get());
      });
    }
  }

  Store.prototype.trigger = function (topic) {
    this.events[topic] = this.events[topic] || [];

    // immutable.
    // so on/off don't change the array durring trigger.
    var foundEvents = this.events[topic].slice();
    foundEvents.forEach(function (event) {
      event();
    });
  };

  Store.prototype.on = function (topic, func) {
    this.events[topic] = this.events[topic] || [];
    this.events[topic].push(func);
  };

  Store.prototype.off = function (topic, fn) {
    this.events[topic] = this.events[topic] || [];

    // find the fn in the arr
    var index = [].indexOf.call(this.events[topic], fn);

    // we didn't find it in the array
    if (index === -1) {
      return;
    }

    this.events[topic].splice(index, 1);
  };

  Store.prototype.get = function () {
    var value = this.data[this.data.length - 1];
    if (!value) {
      return null;
    }

    return clone(value);
  };

  Store.prototype.list = function () {
    return clone(this.data);
  };

  Store.prototype.set = function (value) {
    if (this.options.history) {
      this.data.push(value);
    } else {
      this.data = [value];
    }

    this.trigger('change');

    return this.get();
  };

  return Store;

}));
//# sourceMappingURL=store.js.map