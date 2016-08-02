/* Durruti
 * DOM patch - morphs a DOM node into another.
 */

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

// overwrite addeventlistener
// TODO add IE support
var events = {}

if (typeof window !== 'undefined') {
  var originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, capture) {
    events[this] = events[this] || []
    events[this].push({
      type: type,
      fn: fn,
      capture: capture
    })

    originalAddEventListener.apply(this, arguments)
  }
}

// traverse and remove all events listeners from nodes
// TODO clean-up all =on* events
function removeListeners ($node) {
  if (events[$node]) {
    var nodeEvents = events[$node]

    nodeEvents.forEach((event) => {
      $node.removeEventListener(event.type, event.fn, event.capture)
    })

    events[$node] = null
    delete events[$node]
  }

  var i
  for (i = 0; i < $node.children.length; i++) {
    if ($node.children[i].children.length) {
      removeListeners($node.children[i])
    }
  }
}

