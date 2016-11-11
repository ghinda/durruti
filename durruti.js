(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.durruti = factory());
}(this, (function () { 'use strict';

  /* Durruti
   * Utils.
   */

  function hasWindow() {
    return typeof window !== 'undefined';
  }

  var isClient = hasWindow();

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // one-level object extend


  var DURRUTI_DEBUG = true;

  function warn() {
    if (DURRUTI_DEBUG === true) {
      console.warn.apply(console, arguments);
    }
  }

  /* Durruti
   * Capture and remove event listeners.
   */

  var removeListeners = function removeListeners() {};

  // capture all listeners
  var events = [];
  var domEventTypes = [];

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

    events.push({
      target: this,
      type: type,
      fn: fn,
      capture: capture
    });
  }

  function removeNodeOnEvents(nodes) {
    nodes.forEach(function ($node) {
      domEventTypes.forEach(function (eventType) {
        $node[eventType] = null;
      });
    });
  }

  function removeNodeEvents(nodes) {
    var i = 0;

    while (i < events.length) {
      if (nodes.indexOf(events[i].target) !== -1) {
        var $node = events[i].target;
        // remove listener
        $node.removeEventListener(events[i].type, events[i].fn, events[i].capture);

        // remove event
        events.splice(i, 1);
        i--;
      }

      i++;
    }

    // remove on* listeners
    removeNodeOnEvents(nodes);
  }

  function getNodeList($node, traverse) {
    var nodes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    nodes.push($node);

    // traverse element children
    if (traverse && $node.children) {
      for (var i = 0; i < $node.children.length; i++) {
        getNodeList($node.children[i], true, nodes);
      }
    }

    return nodes;
  }

  if (isClient) {
    domEventTypes = getDomEventTypes();

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
    removeListeners = function removeListeners($node, traverse) {
      removeNodeEvents(getNodeList($node, traverse));
    };
  }

  var removeListeners$1 = removeListeners;

  /* Durruti
   * DOM patch - morphs a DOM node into another.
   */

  var propMap = {
    tabindex: 'tabIndex',
    readonly: 'readOnly',
    for: 'htmlFor',
    class: 'className',
    maxlength: 'maxLength',
    cellspacing: 'cellSpacing',
    cellpadding: 'cellPadding',
    rowspan: 'rowSpan',
    colspan: 'colSpan',
    usemap: 'useMap',
    frameborder: 'frameBorder',
    contenteditable: 'contentEditable'
  };

  function traverse($node, $newNode, patches) {
    // traverse
    for (var i = 0; i < $node.childNodes.length; i++) {
      diff($node.childNodes[i], $newNode.childNodes[i], patches);
    }
  }

  function mapAttributes($node, $newNode) {
    var attrs = {};
    var oldAttributes = $node.attributes;
    var newAttributes = $newNode.attributes;

    for (var i = 0; i < oldAttributes.length; i++) {
      // IE9 returns `checked` as `CHECKED`
      attrs[oldAttributes[i].name.toLowerCase()] = null;
    }

    for (var _i = 0; _i < newAttributes.length; _i++) {
      attrs[newAttributes[_i].name.toLowerCase()] = newAttributes[_i].value;
    }

    return attrs;
  }

  function patchAttrs($node, $newNode) {
    // map attributes
    var attrs = mapAttributes($node, $newNode);

    // add-change attributes
    for (var prop in attrs) {
      if (attrs[prop] === null) {
        $node.removeAttribute(prop);
      } else {
        $node.setAttribute(prop, attrs[prop]);
      }

      // for properties that need to change with attributes,
      // but don't when changed by user input.
      // eg. checked
      $node[propMap[prop] || prop] = attrs[prop];
    }
  }

  function diff($node, $newNode) {
    var patches = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    var patch = {
      node: $node,
      newNode: $newNode
    };

    // push traversed node to patch list
    patches.push(patch);

    // faster than outerhtml
    if ($node.isEqualNode($newNode)) {
      return patches;
    }

    // if one of them is not an element node,
    // or the tag changed,
    // or not the same number of children.
    if ($node.nodeType !== 1 || $newNode.nodeType !== 1 || $node.tagName !== $newNode.tagName || $node.childNodes.length !== $newNode.childNodes.length) {
      patch.replace = true;
    } else {
      patch.update = true;

      // traverse childNodes
      traverse($node, $newNode, patches);
    }

    return patches;
  }

  function applyPatch(patch) {
    if (patch.replace) {
      patch.node.parentNode.replaceChild(patch.newNode, patch.node);
    } else if (patch.update) {
      patchAttrs(patch.node, patch.newNode);

      // remove listeners on node
      removeListeners$1(patch.node);
    } else {
      // remove listeners on node and children
      removeListeners$1(patch.node, true);
    }
  }

  function patch(patches) {
    patches.forEach(applyPatch);

    return patches;
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };





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







  var get = function get(object, property, receiver) {
    if (object === null) object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  };

















  var set = function set(object, property, value, receiver) {
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent !== null) {
        set(parent, property, value, receiver);
      }
    } else if ("value" in desc && desc.writable) {
      desc.value = value;
    } else {
      var setter = desc.set;

      if (setter !== undefined) {
        setter.call(receiver, value);
      }
    }

    return value;
  };

  /* Durruti
   * Micro Isomorphic JavaScript library for building user interfaces.
   */

  var durrutiAttr = 'data-durruti-id';
  var durrutiElemSelector = '[' + durrutiAttr + ']';
  var componentCache = [];
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
    componentCache.push({
      id: component._durrutiId,
      component: component
    });

    return component;
  }

  function getCachedComponent($node) {
    // get the component from the dom node - rendered in browser.
    if ($node._durruti) {
      return $node._durruti;
    }

    // or get it from the component cache - rendered on the server.
    var id = $node.getAttribute(durrutiAttr);
    for (var i = 0; i < componentCache.length; i++) {
      if (componentCache[i].id === id) {
        return componentCache[i].component;
      }
    }
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
      for (var i = 0; i < componentCache.length; i++) {
        if (componentCache[i].id === component._durrutiId) {
          componentCache.splice(i, 1);
          return;
        }
      }
    } else {
      // clear the entire component cache
      componentIndex = 0;
      componentCache.length = 0;
    }
  }

  function createFragment() {
    var template = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

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
  function getComponentNodes($container) {
    var arr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    if ($container._durruti) {
      arr.push($container);
    }

    if ($container.children) {
      for (var i = 0; i < $container.children.length; i++) {
        getComponentNodes($container.children[i], arr);
      }
    }

    return arr;
  }

  var Durruti = function () {
    function Durruti() {
      classCallCheck(this, Durruti);
    }

    createClass(Durruti, [{
      key: 'server',
      value: function server() {
        clearComponentCache();

        return this;
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
        if (isClient && $container) {
          var $newComponent;
          var patches;

          var _ret = function () {
            // check if the container is still in the DOM.
            // when running multiple parallel render's, the container
            // is removed by the previous render, but the reference still in memory.
            if (!document.body.contains($container)) {
              // warn for performance.
              warn('Node', $container, 'is no longer in the DOM. \nIt was probably removed by a parent component.');
              return {
                v: void 0
              };
            }

            var componentNodes = [];
            // convert the template string to a dom node
            $newComponent = createFragment(componentHtml);

            // unmount component and sub-components

            getComponentNodes($container).forEach(unmountNode);

            // if the container is a durruti element,
            // unmount it and it's children and replace the node.
            if (getCachedComponent($container)) {
              // remove the data attributes on the new node,
              // before patch,
              // and get the list of new components.
              cleanAttrNodes($newComponent, true);

              // get required dom patches
              patches = diff($container, $newComponent);


              patches.forEach(function (patch$$1) {
                // always update component instances,
                // even if the dom doesn't change.
                patch$$1.node._durruti = patch$$1.newNode._durruti;

                // patches contain all the traversed nodes.
                // get the mount components here, for performance.
                if (patch$$1.node._durruti) {
                  if (patch$$1.replace) {
                    componentNodes.push(patch$$1.newNode);
                  } else if (patch$$1.update) {
                    componentNodes.push(patch$$1.node);
                  } else {
                    // node is the same,
                    // but we need to mount sub-components.
                    Array.prototype.push.apply(componentNodes, getComponentNodes(patch$$1.node));
                  }
                }
              });

              // morph old dom node into new one
              patch(patches);
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
          }();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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