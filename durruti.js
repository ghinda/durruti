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
  function decorate(component) {
    // instantiate classes
    if (typeof component === 'function') {
      component = new component();
    }

    // get the durruti specific properties
    var props = component._durruti || {};

    // components get a new id on render,
    // so we can clear the previous component cache.
    props.id = String(componentIndex++);

    // set defaults for mount and unmount
    if (typeof component.mount !== 'function') {
      component.mount = function () {};
    }

    if (typeof component.unmount !== 'function') {
      component.unmount = function () {};
    }

    // set the new properties on the component
    component._durruti = props;

    // cache component
    componentCache[props.id] = component;

    return component;
  }

  function getCachedComponent(id) {
    return componentCache[id];
  }

  function clearComponentCache(id) {
    // clear the entire component cache
    if (!id) {
      componentIndex = 0;
      componentCache = {};
    }

    componentCache[id] = null;
  }

  function addComponentId(template, id) {
    // in the browser throw an error if the component template
    // doesn't have a single parent.
    if (typeof window !== 'undefined') {
      var div = document.createElement('div');
      div.innerHTML = template;
      if (div.children.length !== 1) {
        throw new Error('Component template must have a single parent node.', template);
      }
    }

    // naive implementation of adding an attribute to the parent container.
    // so we don't depend on a dom parser.
    // downside is we can't warn that template MUST have a single parent (in Node.js).
    var firstBracketIndex = template.indexOf('>');
    var attr = ' ' + durrutiAttr + '="' + id + '"';

    return template.substr(0, firstBracketIndex) + attr + template.substr(firstBracketIndex);
  }

  var Durruti = function () {
    function Durruti() {
      classCallCheck(this, Durruti);
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
        var componentHtml = addComponentId(template, durrutiComponent._durruti.id);
        var componentId;
        var cachedComponent;
        var componentNodes;

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

          var renderedHtml = $container.innerHTML;

          // if the container is a durruti element,
          // unmount it and it's children and replace the node.
          if ($container.getAttribute(durrutiAttr)) {
            // unmount components that are about to be removed from the dom.
            componentNodes = [].slice.call($container.querySelectorAll(durrutiElemSelector));
            componentNodes.push($container);

            componentNodes.forEach(function (node) {
              componentId = node.getAttribute(durrutiAttr);
              cachedComponent = getCachedComponent(componentId);
              cachedComponent.unmount(node);

              // clear the component from the cache
              clearComponentCache(componentId);
            });

            // convert the template string to a dom node
            var $comp = document.createElement('div');
            $comp.innerHTML = componentHtml;
            $comp = $comp.firstElementChild;

            // insert to the dom component dom node
            $container.parentNode.replaceChild($comp, $container);

            // prepend the parent to the nodelist
            componentNodes = [].slice.call($comp.querySelectorAll(durrutiElemSelector));
            componentNodes.unshift($comp);
          } else {
            // if the component is not a durrti element,
            // insert the template with innerHTML.

            // same html is already rendered
            if (renderedHtml.trim() !== componentHtml.trim()) {
              $container.innerHTML = componentHtml;
            }

            componentNodes = [].slice.call($container.querySelectorAll(durrutiElemSelector));
          }

          // mount newly added components
          componentNodes.forEach(function (node) {
            componentId = node.getAttribute(durrutiAttr);
            cachedComponent = getCachedComponent(componentId);
            cachedComponent.mount(node);
          });
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