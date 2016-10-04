(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = factory());
}(this, (function () { 'use strict';

  var DURRUTI_DEBUG = true;

  function warn() {
    if (DURRUTI_DEBUG === true) {
      console.warn.apply(console, arguments);
    }
  }

  /* Durruti
   * Capture and remove event listeners.
   */

  var _removeListeners = function removeListeners() {};

  // capture all listeners
  var events = {};

  function getDomEventTypes() {
    var eventTypes = [];
    for (var attr in document) {
      // starts with on
      if (attr.substr(0, 2) === 'on') {
        eventTypes.push(attr);
      }
    }

    return eventTypes;
  }

  var originalAddEventListener;

  function captureAddEventListener(type, fn, capture) {
    originalAddEventListener.apply(this, arguments);

    events[this] = events[this] || [];
    events[this].push({
      type: type,
      fn: fn,
      capture: capture
    });
  }

  if (typeof window !== 'undefined') {
    var domEventTypes = getDomEventTypes();

    // capture addEventListener

    // IE
    if (window.Node.prototype.hasOwnProperty('addEventListener')) {
      originalAddEventListener = window.Node.prototype.addEventListener;
      window.Node.prototype.addEventListener = captureAddEventListener;
    } else if (window.EventTarget.prototype.hasOwnProperty('addEventListener')) {
      // standard
      originalAddEventListener = window.EventTarget.prototype.addEventListener;
      window.EventTarget.prototype.addEventListener = captureAddEventListener;
    }

    // traverse and remove all events listeners from nodes
    _removeListeners = function removeListeners($node, traverse) {
      var nodeEvents = events[$node];
      if (nodeEvents) {
        // remove listeners
        nodeEvents.forEach(function (event) {
          $node.removeEventListener(event.type, event.fn, event.capture);
        });

        // remove on* listeners
        domEventTypes.forEach(function (eventType) {
          $node[eventType] = null;
        });

        events[$node] = null;
      }

      // traverse element children
      if (traverse && $node.children) {
        for (var i = 0; i < $node.children.length; i++) {
          if ($node.children[i].children.length) {
            _removeListeners($node.children[i], true);
          }
        }
      }
    };
  }

  var removeListeners = _removeListeners;

  /* Durruti
   * DOM patch - morphs a DOM node into another.
   */

  // traverse and find durruti nodes
  function getComponentNodes($container, traverse) {
    var arr = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

    if ($container._durruti) {
      arr.push($container);
    }

    if (traverse && $container.children) {
      for (var i = 0; i < $container.children.length; i++) {
        if ($container.children[i].children.length) {
          getComponentNodes($container.children[i], true, arr);
        }
      }
    }

    return arr;
  }

  function traverse($node, $newNode, fragment) {
    // traverse
    for (var i = 0; i < $node.childNodes.length; i++) {
      patchElement($node.childNodes[i], $newNode.childNodes[i], fragment);
    }
  }

  function mapAttributes($node, $newNode) {
    var attrs = {};

    for (var i = 0; i < $node.attributes.length; i++) {
      attrs[$node.attributes[i].name] = null;
    }

    for (var _i = 0; _i < $newNode.attributes.length; _i++) {
      attrs[$newNode.attributes[_i].name] = $newNode.attributes[_i].value;
    }

    return attrs;
  }

  function patchAttrs($node, $newNode) {
    // map attributes
    var attrs = mapAttributes($node, $newNode);

    // add-change attributes
    for (var prop in attrs) {
      if (!attrs[prop]) {
        $node.removeAttribute(prop);
      } else {
        $node.setAttribute(prop, attrs[prop]);
      }
    }
  }

  function patchElement($node, $newNode, fragment) {
    // always update the component instance,
    // even if the dom doesn't change.
    $node._durruti = $newNode._durruti;

    // faster than outerhtml
    if ($node.isEqualNode($newNode)) {
      // remove listeners on node and children
      removeListeners($node, true);

      // get component nodes
      Array.prototype.push.apply(fragment.components, getComponentNodes($node, true));

      return fragment;
    }

    var replace = false;

    // if one of them is not an element node,
    // or the tag changed,
    // or not the same number of children.
    if ($node.nodeType !== 1 || $newNode.nodeType !== 1 || $node.tagName !== $newNode.tagName || $node.childNodes.length !== $newNode.childNodes.length) {
      replace = true;

      // get component nodes
      Array.prototype.push.apply(fragment.components, getComponentNodes($newNode, true));
    } else {
      // remove listeners on node
      removeListeners($node);

      // get component nodes
      Array.prototype.push.apply(fragment.components, getComponentNodes($node));

      // traverse childNodes
      traverse($node, $newNode, fragment);
    }

    // replace or update attributes
    fragment.patches.push({
      node: $node,
      newNode: $newNode,
      replace: replace
    });

    return fragment;
  }

  function loopPatch(patch) {
    if (patch.replace) {
      patch.node.parentNode.replaceChild(patch.newNode, patch.node);
    } else {
      patchAttrs(patch.node, patch.newNode);
    }
  }

  function patch($node, $newNode) {
    var fragment = patchElement($node, $newNode, { patches: [], components: [] });
    fragment.patches.forEach(loopPatch);

    return fragment.components;
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

  /* Durruti
   * Micro Isomorphic JavaScript library for building user interfaces.
   */

  var durrutiAttr = 'data-durruti-id';
  var durrutiElemSelector = '[' + durrutiAttr + ']';
  var componentCache = {};
  var componentIndex = 0;

  // decorate a basic class with durruti specific properties
  function decorate(Comp) {
    var component;

    // instantiate classes
    if (typeof Comp === 'function') {
      component = new Comp();
    } else {
      // make sure we don't change the id on a cached component
      component = Object.create(Comp);
    }

    // components get a new id on render,
    // so we can clear the previous component cache.
    component._durrutiId = String(componentIndex++);

    // cache component
    componentCache[component._durrutiId] = component;

    return component;
  }

  function getCachedComponent($node) {
    // get the component from the dom node - rendered in browser.
    // or get it from the component cache - rendered on the server.
    return $node._durruti || componentCache[$node.getAttribute(durrutiAttr)];
  }

  // remove custom data attributes,
  // and cache the component on the DOM node.
  function cleanAttrNodes($container, includeParent) {
    var nodes = [].slice.call($container.querySelectorAll(durrutiElemSelector));

    if (includeParent) {
      nodes.push($container);
    }

    nodes.forEach(function ($node) {
      // cache component in node
      $node._durruti = getCachedComponent($node);

      // clean-up data attributes
      $node.removeAttribute(durrutiAttr);
    });

    return nodes;
  }

  function unmountNode($node) {
    var cachedComponent = getCachedComponent($node);

    if (cachedComponent.unmount) {
      cachedComponent.unmount($node);
    }

    // clear the component from the cache
    clearComponentCache(cachedComponent);
  }

  function mountNode($node) {
    var cachedComponent = getCachedComponent($node);

    if (cachedComponent.mount) {
      cachedComponent.mount($node);
    }
  }

  function clearComponentCache(component) {
    if (component) {
      componentCache[component._durrutiId] = null;
    } else {
      // clear the entire component cache
      componentIndex = 0;
      componentCache = {};
    }
  }

  function createFragment() {
    var template = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    template = template.trim();
    var parent = 'div';
    var $node;

    if (template.indexOf('<tr') === 0) {
      // table row
      parent = 'tbody';
    } else if (template.indexOf('<td') === 0) {
      // table column
      parent = 'tr';
    }

    $node = document.createElement(parent);
    $node.innerHTML = template;

    if ($node.children.length !== 1) {
      throw new Error('Component template must have a single parent node.', template);
    }

    return $node.firstElementChild;
  }

  function addComponentId(template, component) {
    // naive implementation of adding an attribute to the parent container.
    // so we don't depend on a dom parser.
    // downside is we can't warn that template MUST have a single parent (in Node.js).

    // check void elements first.
    var firstBracketIndex = template.indexOf('/>');

    // non-void elements
    if (firstBracketIndex === -1) {
      firstBracketIndex = template.indexOf('>');
    }

    var attr = ' ' + durrutiAttr + '="' + component._durrutiId + '"';

    return template.substr(0, firstBracketIndex) + attr + template.substr(firstBracketIndex);
  }

  function missingStateError() {
    warn('state.js is not included. Store data will not be shared between client and server.');
  }

  // prevent errors when state.js is not included on the client

  var StateMock = function () {
    function StateMock() {
      classCallCheck(this, StateMock);
    }

    createClass(StateMock, [{
      key: 'get',
      value: function get() {
        missingStateError();
      }
    }, {
      key: 'set',
      value: function set() {
        missingStateError();
      }
    }]);
    return StateMock;
  }();

  var Durruti = function () {
    function Durruti() {
      classCallCheck(this, Durruti);

      this._state = new StateMock();
    }

    createClass(Durruti, [{
      key: 'renderStatic',
      value: function renderStatic(template) {
        clearComponentCache();

        return template;
      }
    }, {
      key: 'render',
      value: function render(component, $container) {
        // decorate basic classes with durruti properties
        var durrutiComponent = decorate(component);

        if (typeof durrutiComponent.render === 'undefined') {
          throw new Error('Components must have a render() method.');
        }

        var template = durrutiComponent.render();
        var componentHtml = addComponentId(template, durrutiComponent);

        // mount and unmount in browser, when we specify a container.
        if (typeof window !== 'undefined' && $container) {
          // check if the container is still in the DOM.
          // when running multiple parallel render's, the container
          // is removed by the previous render, but the reference still in memory.
          if (!document.body.contains($container)) {
            // warn for performance.
            warn('Node', $container, 'is no longer in the DOM. \nIt was probably removed by a parent component.');
            return;
          }

          var componentNodes = [];
          // convert the template string to a dom node
          var $newComponent = createFragment(componentHtml);

          // if the container is a durruti element,
          // unmount it and it's children and replace the node.
          if (getCachedComponent($container)) {
            // unmount components that are about to be removed from the dom.
            getComponentNodes($container, true).forEach(unmountNode);

            // remove the data attributes on the new node,
            // before patch.
            cleanAttrNodes($newComponent, true);

            // morph old dom node into new one
            componentNodes = patch($container, $newComponent);
          } else {
            // if the component is not a durruti element,
            // insert the template with innerHTML.

            // only if the same html is not already rendered
            if (!$container.firstElementChild || !$container.firstElementChild.isEqualNode($newComponent)) {
              $container.innerHTML = componentHtml;
            }

            componentNodes = cleanAttrNodes($container);
          }

          // mount newly added components
          componentNodes.forEach(mountNode);
        }

        return componentHtml;
      }
    }]);
    return Durruti;
  }();

  var durruti = new Durruti();

  return durruti;

})));
//# sourceMappingURL=durruti.js.map