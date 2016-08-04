/* Durruti
 * Capture and remove event listeners.
 */

var removeListeners = () => {}

if (typeof window !== 'undefined') {
  // capture all listeners
  var events = {}

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

  var domEventTypes = getDomEventTypes()

  var originalAddEventListener

  function captureAddEventListener (type, fn, capture) {
    originalAddEventListener.apply(this, arguments)

    events[this] = events[this] || []
    events[this].push({
      type: type,
      fn: fn,
      capture: capture
    })
  }

  if (typeof window !== 'undefined') {

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
  }

  // traverse and remove all events listeners from nodes
  removeListeners = function ($node, traverse) {
    var nodeEvents = events[$node]
    if (nodeEvents) {
      // remove listeners
      nodeEvents.forEach((event) => {
        $node.removeEventListener(event.type, event.fn, event.capture)
      })

      // remove on* listeners
      domEventTypes.forEach((eventType) => {
        $node[eventType] = null
      })

      events[$node] = null
    }

    // traverse element children
    if (traverse && $node.children) {
      for (let i = 0; i < $node.children.length; i++) {
        if ($node.children[i].children.length) {
          removeListeners($node.children[i], true)
        }
      }
    }
  }
}

export default removeListeners
