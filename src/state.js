/* Durruti
 * Shared state between client and server.
 */

var namespace = 'DURRUTI'

export default class State {
  constructor () {
    this.data = {}
  }

  get (key) {
    if (typeof window !== 'undefined') {
      if (window[namespace]) {
        return window[namespace][key]
      } else {
        return null
      }
    } else {
      return this.data[key]
    }
  }

  set (key, value) {
    this.data[key] = value
  }

  render () {
    return `
      <script>
      ;(function(){
        window['${namespace}'] = ${JSON.stringify(this.data)}
      }());
      </script>
    `
  }
}
