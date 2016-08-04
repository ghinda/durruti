/* Durruti
 * DOM patch - morphs a DOM node into another.
 */

import removeListeners from './listeners.js'

function traverse ($node, $newNode, patches) {
  // traverse
  for (let i = 0; i < $node.childNodes.length; i++) {
    patchElement($node.childNodes[i], $newNode.childNodes[i], patches)
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

  // update the cached component
  $node._durruti = $newNode._durruti
}

function patchElement ($node, $newNode, patches) {
  // faster than outerhtml
  if ($node.isEqualNode($newNode)) {
    return []
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
  } else {
    // traverse children
    traverse($node, $newNode, patches)
  }

  // replace or update attributes
  patches.push({
    node: $node,
    newNode: $newNode,
    replace: replace
  })

  return patches
}

function loopPatch (patch) {
  if (patch.replace) {
    patch.node.parentNode.replaceChild(patch.newNode, patch.node)
  } else {
    patchAttrs(patch.node, patch.newNode)
    removeListeners(patch.node)
  }
}

export default function patch ($node, $newNode) {
  var patches = patchElement($node, $newNode, [])
  patches.forEach(loopPatch)

  // check if the $node was replaced by $newNode
  if (patches[0] &&
    patches[0].node === $node &&
    patches[0].replace === true) {
    return $newNode
  }

  return $node
}

