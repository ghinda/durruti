/* Durruti
 * Data store with change events.
 */

import * as util from './util'

function Store (name, options) {
  options = options || {}

  var historySupport = false
  // history is active only in the browser, by default
  if (util.isClient) {
    historySupport = true
  }

  this.options = util.extend(options, {
    history: historySupport
  })

  this.events = {
    change: []
  }

  this.data = []
}

Store.prototype.trigger = function (topic) {
  this.events[topic] = this.events[topic] || []

  // immutable.
  // so on/off don't change the array durring trigger.
  var foundEvents = this.events[topic].slice()
  foundEvents.forEach((event) => {
    event()
  })
}

Store.prototype.on = function (topic, func) {
  this.events[topic] = this.events[topic] || []
  this.events[topic].push(func)
}

Store.prototype.off = function (topic, fn) {
  this.events[topic] = this.events[topic] || []

  // find the fn in the arr
  var index = [].indexOf.call(this.events[topic], fn)

  // we didn't find it in the array
  if (index === -1) {
    return
  }

  this.events[topic].splice(index, 1)
}

Store.prototype.get = function () {
  var value = this.data[this.data.length - 1]
  if (!value) {
    return null
  }

  return util.clone(value)
}

Store.prototype.list = function () {
  return util.clone(this.data)
}

Store.prototype.set = function (value) {
  if (this.options.history) {
    this.data.push(value)
  } else {
    this.data = [ value ]
  }

  this.trigger('change')

  return this.get()
}

export default Store
