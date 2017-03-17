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
  var oldAttributes = $node.attributes
  var newAttributes = $newNode.attributes

  for (let i = 0; i < oldAttributes.length; i++) {
    // IE9 returns `checked` as `CHECKED`
    attrs[oldAttributes[i].name.toLowerCase()] = null
  }

  for (let i = 0; i < newAttributes.length; i++) {
    attrs[newAttributes[i].name.toLowerCase()] = newAttributes[i].value
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
    var p = propMap[prop] || prop
    var currentValue = $node[p]
    if (currentValue !== attrs[prop]) {
      $node[p] = attrs[prop]
    }
  }
}

export function diff ($node, $newNode, patches = []) {
  var patch = {
    node: $node,
    newNode: $newNode
  }

  // push traversed node to patch list
  patches.push(patch)

  // if one of them is not an element node,
  // or the tag changed,
  // or not the same number of children.
  if ($node.nodeType !== 1 ||
    $newNode.nodeType !== 1 ||
    $node.tagName !== $newNode.tagName ||
    $node.childNodes.length !== $newNode.childNodes.length) {
    patch.replace = true
  } else {
    // check if attributes changed
    if (!$node.cloneNode().isEqualNode($newNode.cloneNode())) {
      patch.update = true
    }

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

    // remove listeners on node
    removeListeners(patch.node)
  } else {
    // remove listeners on node and children
    removeListeners(patch.node, true)
  }
}

export function patch (patches) {
  patches.forEach(applyPatch)

  return patches
}

