/* Durruti
 * Shared state between client and server.
 */

var namespace = 'DURRUTI'

function State () {
  var data = {}

  function get (key) {
    if (typeof window !== 'undefined') {
      if (window[namespace]) {
        return window[namespace][key]
      } else {
        return null
      }
    } else {
      return data[key]
    }
  }

  function set (key, value) {
    data[key] = value
  }

  function render () {
    return `
      ;(function(){
        window['${namespace}'] = JSON.parse('${JSON.stringify(data)}')
      }());
    `
  }

  return {
    get: get,
    set: set,
    render: render
  }
}

export default State()
