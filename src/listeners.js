/* Durruti
 * Capture and remove event listeners.
 */

import * as util from './util'

var removeListeners = () => {}

// capture all listeners
var events = []
var domEventTypes = []

function getDomEventTypes () {
  var eventTypes = []
  for (let attr in document) {
    // starts with on
    if (attr.substr(0, 2) === 'on') {
      eventTypes.push(attr)
    }
  }

  return eventTypes
}

var originalAddEventListener

function captureAddEventListener (type, fn, capture) {
  originalAddEventListener.apply(this, arguments)

  events.push({
    target: this,
    type: type,
    fn: fn,
    capture: capture
  })
}

function removeNodeOnEvents (nodes) {
  nodes.forEach(($node) => {
    domEventTypes.forEach((eventType) => {
      $node[eventType] = null
    })
  })
}

function removeNodeEvents (nodes) {
  var i = 0

  while (i < events.length) {
    if (nodes.indexOf(events[i].target) !== -1) {
      var $node = events[i].target
      // remove listener
      $node.removeEventListener(events[i].type, events[i].fn, events[i].capture)

      // remove event
      events.splice(i, 1)
      i--
    }

    i++
  }

  // remove on* listeners
  removeNodeOnEvents(nodes)
}

function getNodeList ($node, traverse, nodes = []) {
  nodes.push($node)

  // traverse element children
  if (traverse && $node.children) {
    for (let i = 0; i < $node.children.length; i++) {
      getNodeList($node.children[i], true, nodes)
    }
  }

  return nodes
}

if (util.isClient) {
  domEventTypes = getDomEventTypes()

  // capture addEventListener

  // IE
  if (window.Node.prototype.hasOwnProperty('addEventListener')) {
    originalAddEventListener = window.Node.prototype.addEventListener
    window.Node.prototype.addEventListener = captureAddEventListener
  } else if (window.EventTarget.prototype.hasOwnProperty('addEventListener')) {
    // standard
    originalAddEventListener = window.EventTarget.prototype.addEventListener
    window.EventTarget.prototype.addEventListener = captureAddEventListener
  }

  // traverse and remove all events listeners from nodes
  removeListeners = ($node, traverse) => {
    removeNodeEvents(getNodeList($node, traverse))
  }
}

export default removeListeners
