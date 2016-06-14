/* Durruti
 * Shared state between client and server.
 */

var namespace = 'DURRUTI'

var data = {}

class State {
  get (key) {
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

  set (key, value) {
    data[key] = value
  }

  render () {
    return `
      <script>
      ;(function(){
        window['${namespace}'] = JSON.parse('${JSON.stringify(data)}')
      }());
      </script>
    `
  }
}

export default new State()
