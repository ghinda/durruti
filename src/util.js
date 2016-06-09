/* Durruti
 * Utils.
 */

export function clone (obj) {
  return JSON.parse(JSON.stringify(obj))
}

// one-level object extend
export function extend (obj, defaults) {
  if (obj === null) {
    obj = {}
  }

  // clone object
  var extended = clone(obj)

  // copy default keys where undefined
  Object.keys(defaults).forEach(function (key) {
    if (typeof extended[key] !== 'undefined') {
      extended[key] = obj[key]
    } else {
      extended[key] = defaults[key]
    }
  })

  return extended
}

if (typeof window !== 'undefined') {
  global = window
}
var debugFlag = 'DURRUTI_DEBUG'
global[debugFlag] = true

export function warn () {
  if (global[debugFlag] === true) {
    console.warn.apply(console, arguments)
  }
}
