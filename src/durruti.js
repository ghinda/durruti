/* Durruti
 * Micro Isomorphic JavaScript library for building user interfaces.
 */

import * as util from './util'
import * as dom from './dom'

const durrutiAttr = 'data-durruti-id'
const durrutiElemSelector = `[${durrutiAttr}]`
var componentCache = {}
var componentIndex = 0

// decorate a basic class with durruti specific properties
function decorate (Comp) {
  var component

  // instantiate classes
  if (typeof Comp === 'function') {
    component = new Comp()
  } else {
    // make sure we don't change the id on a cached component
    component = Object.create(Comp)
  }

  // components get a new id on render,
  // so we can clear the previous component cache.
  component._durrutiId = String(componentIndex++)

  // cache component
  componentCache[component._durrutiId] = component

  return component
}

function getCachedComponent ($node) {
  // get the component from the dom node - rendered in browser.
  // or get it from the component cache - rendered on the server.
  return $node._durruti || componentCache[$node.getAttribute(durrutiAttr)]
}

// remove custom data attributes,
// and cache the component on the DOM node.
function cleanAttrNodes ($container, includeParent) {
  var nodes = [].slice.call($container.querySelectorAll(durrutiElemSelector))

  if (includeParent) {
    nodes.push($container)
  }

  nodes.forEach(($node) => {
    // cache component in node
    $node._durruti = getCachedComponent($node)

    // clean-up data attributes
    $node.removeAttribute(durrutiAttr)
  })

  return nodes
}

function unmountNode ($node) {
  var cachedComponent = getCachedComponent($node)

  if (cachedComponent.unmount) {
    cachedComponent.unmount($node)
  }

  // clear the component from the cache
  clearComponentCache(cachedComponent)
}

function mountNode ($node) {
  var cachedComponent = getCachedComponent($node)

  if (cachedComponent.mount) {
    cachedComponent.mount($node)
  }
}

function clearComponentCache (component) {
  if (component) {
    componentCache[component._durrutiId] = null
  } else {
    // clear the entire component cache
    componentIndex = 0
    componentCache = {}
  }
}

function createFragment (template = '') {
  template = template.trim()
  var parent = 'div'
  var $node

  if (template.indexOf('<tr') === 0) {
    // table row
    parent = 'tbody'
  } else if (template.indexOf('<td') === 0) {
    // table column
    parent = 'tr'
  }

  $node = document.createElement(parent)
  $node.innerHTML = template

  if ($node.children.length !== 1) {
    throw new Error('Component template must have a single parent node.', template)
  }

  return $node.firstElementChild
}

function addComponentId (template, component) {
  // naive implementation of adding an attribute to the parent container.
  // so we don't depend on a dom parser.
  // downside is we can't warn that template MUST have a single parent (in Node.js).

  // check void elements first.
  var firstBracketIndex = template.indexOf('/>')

  // non-void elements
  if (firstBracketIndex === -1) {
    firstBracketIndex = template.indexOf('>')
  }

  var attr = ` ${durrutiAttr}="${component._durrutiId}"`

  return template.substr(0, firstBracketIndex) + attr + template.substr(firstBracketIndex)
}

function missingStateError () {
  util.warn('state.js is not included. Store data will not be shared between client and server.')
}

// prevent errors when state.js is not included on the client
class StateMock {
  get () {
    missingStateError()
  }
  set () {
    missingStateError()
  }
}

class Durruti {
  constructor () {
    this._state = new StateMock()
  }

  renderStatic (template) {
    clearComponentCache()

    return template
  }

  render (component, $container) {
    // decorate basic classes with durruti properties
    var durrutiComponent = decorate(component)

    if (typeof durrutiComponent.render === 'undefined') {
      throw new Error('Components must have a render() method.')
    }

    var template = durrutiComponent.render()
    var componentHtml = addComponentId(template, durrutiComponent)

    // mount and unmount in browser, when we specify a container.
    if (typeof window !== 'undefined' && $container) {
      // check if the container is still in the DOM.
      // when running multiple parallel render's, the container
      // is removed by the previous render, but the reference still in memory.
      if (!document.body.contains($container)) {
        // warn for performance.
        util.warn('Node', $container, 'is no longer in the DOM. \nIt was probably removed by a parent component.')
        return
      }

      let componentNodes = []
      // convert the template string to a dom node
      var $newComponent = createFragment(componentHtml)

      // if the container is a durruti element,
      // unmount it and it's children and replace the node.
      if (getCachedComponent($container)) {
        // unmount components that are about to be removed from the dom.
        dom.getComponentNodes($container, true).forEach(unmountNode)

        // remove the data attributes on the new node,
        // before patch.
        cleanAttrNodes($newComponent, true)

        // morph old dom node into new one
        componentNodes = dom.patch($container, $newComponent)
      } else {
        // if the component is not a durruti element,
        // insert the template with innerHTML.

        // only if the same html is not already rendered
        if (!$container.firstElementChild ||
          !$container.firstElementChild.isEqualNode($newComponent)) {
          $container.innerHTML = componentHtml
        }

        componentNodes = cleanAttrNodes($container)
      }

      // mount newly added components
      componentNodes.forEach(mountNode)
    }

    return componentHtml
  }
}

export default new Durruti()
