/* Durruti
 * Utils.
 */

function hasWindow () {
  return (typeof window !== 'undefined')
}

export var isClient = hasWindow()

export function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

// one-level object extend
export function extend (obj = {}, defaults) {
  // clone object
  var extended = clone(obj)

  // copy default keys where undefined
  Object.keys(defaults).forEach(function (key) {
    if (typeof extended[key] === 'undefined') {
      extended[key] = defaults[key]
    }
  })

  return extended
}

var DURRUTI_DEBUG = true

export function warn () {
  if (DURRUTI_DEBUG === true) {
    console.warn.apply(console, arguments)
  }
}
