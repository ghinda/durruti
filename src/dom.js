/* Durruti
 * DOM patch - morphs a DOM node into another.
 */

import removeListeners from './listeners.js'

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
}

function traverse ($node, $newNode, patches) {
  // traverse
  for (let i = 0; i < $node.childNodes.length; i++) {
    diff($node.childNodes[i], $newNode.childNodes[i], patches)
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
    if (attrs[prop] === null) {
      $node.removeAttribute(prop)
    } else {
      $node.setAttribute(prop, attrs[prop])
    }

    // for properties that need to change with attributes,
    // but don't when changed by user input.
    // eg. checked
    $node[propMap[prop] || prop] = attrs[prop]
  }
}

export function diff ($node, $newNode, patches = []) {
  var patch = {
    node: $node,
    newNode: $newNode
  }

  // push traversed node to patch list
  patches.push(patch)

  // faster than outerhtml
  if ($node.isEqualNode($newNode)) {
    // remove listeners on node and children
    removeListeners($node, true)

    return patches
  }

  // if one of them is not an element node,
  // or the tag changed,
  // or not the same number of children.
  if ($node.nodeType !== 1 ||
    $newNode.nodeType !== 1 ||
    $node.tagName !== $newNode.tagName ||
    $node.childNodes.length !== $newNode.childNodes.length) {
    patch.replace = true
  } else {
    patch.update = true

    // remove listeners on node
    removeListeners($node)

    // traverse childNodes
    traverse($node, $newNode, patches)
  }

  return patches
}

function applyPatch (patch) {
  if (patch.replace) {
    patch.node.parentNode.replaceChild(patch.newNode, patch.node)
  } else if (patch.update) {
    patchAttrs(patch.node, patch.newNode)
  }
}

export function patch (patches) {
  patches.forEach(applyPatch)

  return patches
}

