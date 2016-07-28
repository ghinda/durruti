/* Durruti
 * Micro Isomorphic JavaScript library for building user interfaces.
 */

import * as util from './util'

var durrutiAttr = 'data-durruti-id'
var durrutiElemSelector = `[${durrutiAttr}]`
var componentCache = {}
var componentIndex = 0

// decorate a basic class with durruti specific properties
function decorate (Comp) {
  var component

  // instantiate classes
  if (typeof Comp === 'function') {
    component = new Comp()
  } else {
    component = Comp
  }

  // get the durruti specific properties
  var props = component._durruti || {}

  // components get a new id on render,
  // so we can clear the previous component cache.
  props.id = String(componentIndex++)

  // set defaults for mount and unmount
  if (typeof component.mount !== 'function') {
    component.mount = function () {}
  }

  if (typeof component.unmount !== 'function') {
    component.unmount = function () {}
  }

  // set the new properties on the component
  component._durruti = props

  // cache component
  componentCache[props.id] = component

  return component
}

// function getCachedComponent (id) {
//   return componentCache[id]
// }

function clearComponentCache (id) {
  // clear the entire component cache
  if (!id) {
    componentIndex = 0
    componentCache = {}
  }

  componentCache[id] = null
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

function addComponentId (template, id) {
  // naive implementation of adding an attribute to the parent container.
  // so we don't depend on a dom parser.
  // downside is we can't warn that template MUST have a single parent (in Node.js).
  var firstBracketIndex = template.indexOf('>')
  var attr = ` ${durrutiAttr}="${id}"`

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

function traverseNodes ($container, arr) {
  var i
  for (i = 0; i < $container.children.length; i++) {
    if ($container.children[i].children.length) {
      traverseNodes($container.children[i], arr)
    }

    if ($container.children[i]._durruti) {
      arr.push($container.children[i])
    }
  }

  return arr
}

function trav ($container) {
  var arr = []
  return traverseNodes($container, arr)
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
    var componentHtml = addComponentId(template, durrutiComponent._durruti.id)
//     var componentId
    var cachedComponent
    var componentNodes
    var mountMap = []

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

      var renderedHtml = $container.innerHTML

      // if the container is a durruti element,
      // unmount it and it's children and replace the node.
//       if ($container.getAttribute(durrutiAttr)) {
      if ($container._durruti) {
        // unmount components that are about to be removed from the dom.
//         componentNodes = [].slice.call($container.querySelectorAll(durrutiElemSelector))
        componentNodes = trav($container)
        componentNodes.push($container)

        componentNodes.forEach((node) => {
//           componentId = node.getAttribute(durrutiAttr)
//           cachedComponent = getCachedComponent(componentId)

//           console.log('unmount', node)

          cachedComponent = node._durruti
          cachedComponent.unmount(node)

          // clear the component from the cache
//           clearComponentCache(componentId)
        })

        // convert the template string to a dom node
        var $comp = createFragment(componentHtml)

        // prepend the parent to the nodelist
        componentNodes = [].slice.call($comp.querySelectorAll(durrutiElemSelector))
        componentNodes.unshift($comp)

        $comp._durruti = durrutiComponent

        // TODO clean-up data attributes
        componentNodes.forEach((node) => {
          mountMap.push(node)
          node.removeAttribute(durrutiAttr)

          node._durruti = durrutiComponent
        })

        // insert to the dom component dom node
//         $container.parentNode.replaceChild($comp, $container)
        patch($container, $comp)
      } else {
        // if the component is not a durrti element,
        // insert the template with innerHTML.

        // same html is already rendered
        if (renderedHtml.trim() !== componentHtml.trim()) {
          $container.innerHTML = componentHtml
        }

        componentNodes = [].slice.call($container.querySelectorAll(durrutiElemSelector))

        // TODO clean-up data attributes
        componentNodes.forEach((node) => {
          mountMap.push(node)
          node.removeAttribute(durrutiAttr)

          node._durruti = durrutiComponent
        })

        $container._durruti = durrutiComponent
      }

      // mount newly added components
//       componentNodes.forEach((node) => {
//         componentId = node.getAttribute(durrutiAttr)
//         cachedComponent = getCachedComponent(componentId)
//         cachedComponent.mount(node)
//       })

      mountMap.forEach((node) => {
//         cachedComponent = getCachedComponent(comp.id)
//         cachedComponent.mount(comp.$container)

//         console.log('mount', node)

        node._durruti.mount(node)
      })
    }

    return componentHtml
  }
}

function traverse ($node, $newNode, patches) {
  var children = $node.childNodes
  var newChildren = $newNode.childNodes

  if (children.length === newChildren.length) {
    // traverse
    var i
    for (i = 0; i < newChildren.length; i++) {
      patchElement(children[i], newChildren[i], patches)
    }
  } else {
    // replace
    patches.push({
      node: $node,
      newNode: $newNode,
      replace: true
    })
  }
}

function mapAttributes ($node, $newNode) {
  var attrs = {}
  var i

  for (i = 0; i < $node.attributes.length; i++) {
    if ($node.attributes[i].name !== 'class') {
      attrs[$node.attributes[i].name] = null
    }
  }

  for (i = 0; i < $newNode.attributes.length; i++) {
    if ($newNode.attributes[i].name !== 'class') {
      attrs[$newNode.attributes[i].name] = $newNode.attributes[i].value
    }
  }

  return attrs
}

function patchAttrs ($node, $newNode) {
  // map attributes
  var attrs = mapAttributes($node, $newNode)
  var props = Object.keys(attrs)

  // add-change attributes
  var i
  for (i = 0; i < props.length; i++) {
    if (!attrs[props[i]]) {
      $node.removeAttribute(props[i])
    } else {
      $node.setAttribute(props[i], attrs[props[i]])
    }
  }
}

function mapClasses ($node, $newNode) {
  var classNames = {}
  var i

  for (i = 0; i < $node.classList.length; i++) {
    classNames[$node.classList[i]] = false
  }

  for (i = 0; i < $newNode.classList.length; i++) {
    classNames[$newNode.classList[i]] = true
  }

  return classNames
}

function patchClassList ($node, $newNode) {
  // map attributes
  var classNames = mapClasses($node, $newNode)
  var props = Object.keys(classNames)

  // add-change attributes
  var i
  for (i = 0; i < props.length; i++) {
    if (classNames[props[i]]) {
      $node.classList.add(props[i])
    } else {
      $node.classList.remove(props[i])
    }
  }
}

function patchElement ($node, $newNode, patches) {
  var newType = $newNode.nodeType
  var oldType = $node.nodeType
  var replace = false

  // if element node
  if (oldType === 1 && newType === 1) {
    // with the same tag name
    if ($node.tagName !== $newNode.tagName) {
      replace = true
    } else if ($node.innerHTML !== $newNode.innerHTML) {
      traverse($node, $newNode, patches)
    }
  } else {
    replace = true
  }

  // change attrs
  patches.push({
    node: $node,
    newNode: $newNode,
    replace: replace

  })
}

function loopPatch (patch) {
  if (patch.replace) {
    patch.node.parentNode.replaceChild(patch.newNode, patch.node)
  } else {
    patchAttrs(patch.node, patch.newNode)
    patchClassList(patch.node, patch.newNode)
  }

  patch.node._durruti = patch.newNode._durruti
}

function patch ($node, $newNode) {
  var patches = []
  patchElement($node, $newNode, patches)

  var i
  for (i = 0; i < patches.length; i++) {
    loopPatch(patches[i])
  }
}

export default new Durruti()
