(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = factory());
}(this, function () { 'use strict';

  var DURRUTI_DEBUG = true;

  function warn() {
    if (DURRUTI_DEBUG === true) {
      console.warn.apply(console, arguments);
    }
  }

  /* Durruti
   * DOM patch - morphs a DOM node into another.
   */

  function traverse($node, $newNode, patches) {
    // traverse
    for (var i = 0; i < $node.childNodes.length; i++) {
      patchElement($node.childNodes[i], $newNode.childNodes[i], patches);
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

    // update the cached component
    $node._durruti = $newNode._durruti;
  }

  function patchElement($node, $newNode, patches) {
    // faster than outerhtml
    if ($node.isEqualNode($newNode)) {
      return;
    }

    var replace = false;

    // if one of them is not an element node,
    // or the tag changed,
    // or not the same number of children.
    if ($node.nodeType !== 1 || $newNode.nodeType !== 1 || $node.tagName !== $newNode.tagName || $node.childNodes.length !== $newNode.childNodes.length) {
      replace = true;
    } else {
      // traverse children
      traverse($node, $newNode, patches);
    }

    // replace or update attributes
    patches.push({
      node: $node,
      newNode: $newNode,
      replace: replace
    });

    return patches;
  }

  function loopPatch(patch) {
    if (patch.replace) {
      patch.node.parentNode.replaceChild(patch.newNode, patch.node);
    } else {
      patchAttrs(patch.node, patch.newNode);
    }
  }

  function patch($node, $newNode) {
    patchElement($node, $newNode, []).forEach(loopPatch);
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

  function getMountNodes($container, includeParent) {
    var nodes = [].slice.call($container.querySelectorAll(durrutiElemSelector));

    if (includeParent) {
      nodes.unshift($container);
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

  // traverse and find durruti nodes
  function traverseNodes($container, arr) {
    var i;
    for (i = 0; i < $container.children.length; i++) {
      if ($container.children[i].children.length) {
        traverseNodes($container.children[i], arr);
      }

      if ($container.children[i]._durruti) {
        arr.push($container.children[i]);
      }
    }

    return arr;
  }

  function getComponentNodes($container) {
    var arr = traverseNodes($container, []);
    arr.push($container);
    return arr;
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

          // if the container is a durruti element,
          // unmount it and it's children and replace the node.
          if (getCachedComponent($container)) {
            // unmount components that are about to be removed from the dom.
            getComponentNodes($container).forEach(unmountNode);

            // convert the template string to a dom node
            var $newComponent = createFragment(componentHtml);
            // needs to happen before patch,
            // to remove the data attributes.
            componentNodes = getMountNodes($newComponent, true);

            // morph old dom node into new one
            patch($container, $newComponent);
          } else {
            // if the component is not a durruti element,
            // insert the template with innerHTML.

            // same html is already rendered
            if ($container.innerHTML.trim() !== componentHtml.trim()) {
              $container.innerHTML = componentHtml;
            }

            componentNodes = getMountNodes($container);
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

}));
//# sourceMappingURL=durruti.js.map