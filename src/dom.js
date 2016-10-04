/* Durruti
 * DOM patch - morphs a DOM node into another.
 */

import removeListeners from './listeners.js'

// traverse and find durruti nodes
export function getComponentNodes ($container, traverse, arr = []) {
  if ($container._durruti) {
    arr.push($container)
  }

  if (traverse && $container.children) {
    for (let i = 0; i < $container.children.length; i++) {
      if ($container.children[i].children.length) {
        getComponentNodes($container.children[i], true, arr)
      }
    }
  }

  return arr
}

function traverse ($node, $newNode, fragment) {
  // traverse
  for (let i = 0; i < $node.childNodes.length; i++) {
    patchElement($node.childNodes[i], $newNode.childNodes[i], fragment)
  }
}

function mapAttributes ($node, $newNode) {
  var attrs = {}

  for (let i = 0; i < $node.attributes.length; i++) {
    attrs[$node.attributes[i].name] = null
  }

  for (let i = 0; i < $newNode.attributes.length; i++) {
    attrs[$newNode.attributes[i].name] = $newNode.attributes[i].value
  }

  return attrs
}

function patchAttrs ($node, $newNode) {
  // map attributes
  var attrs = mapAttributes($node, $newNode)

  // add-change attributes
  for (let prop in attrs) {
    if (!attrs[prop]) {
      $node.removeAttribute(prop)
    } else {
      $node.setAttribute(prop, attrs[prop])
    }
  }
}

function patchElement ($node, $newNode, fragment) {
  // always update the component instance,
  // even if the dom doesn't change.
  $node._durruti = $newNode._durruti

  // faster than outerhtml
  if ($node.isEqualNode($newNode)) {
    // remove listeners on node and children
    removeListeners($node, true)

    // get component nodes
    Array.prototype.push.apply(fragment.components, getComponentNodes($node, true))

    return fragment
  }

  var replace = false

  // if one of them is not an element node,
  // or the tag changed,
  // or not the same number of children.
  if ($node.nodeType !== 1 ||
    $newNode.nodeType !== 1 ||
    $node.tagName !== $newNode.tagName ||
    $node.childNodes.length !== $newNode.childNodes.length) {
    replace = true

    // get component nodes
    Array.prototype.push.apply(fragment.components, getComponentNodes($newNode, true))
  } else {
    // remove listeners on node
    removeListeners($node)

    // get component nodes
    Array.prototype.push.apply(fragment.components, getComponentNodes($node))

    // traverse childNodes
    traverse($node, $newNode, fragment)
  }

  // replace or update attributes
  fragment.patches.push({
    node: $node,
    newNode: $newNode,
    replace: replace
  })

  return fragment
}

function loopPatch (patch) {
  if (patch.replace) {
    patch.node.parentNode.replaceChild(patch.newNode, patch.node)
  } else {
    patchAttrs(patch.node, patch.newNode)
  }
}

export function patch ($node, $newNode) {
  var fragment = patchElement($node, $newNode, { patches: [], components: [] })
  fragment.patches.forEach(loopPatch)

  return fragment.components
}

