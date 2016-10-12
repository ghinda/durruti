/* core tests
 */

describe('Client Core', function () {
  'use strict'

  var $fixtures = document.querySelector('.fixtures')

  var $app
  beforeEach(function () {
    if ($app) {
      $fixtures.removeChild($app)
    }

    $app = document.createElement('div')
    $fixtures.appendChild($app)
  })

  it('should not change node instance when back-end rendered', function () {
    function Two () {
      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.render = function () {
        return '<div>' + durruti.render(Two) + '</div>'
      }
    }

    // simulate server render
    $app.innerHTML = durruti.server().render(One)

    var $container = $app.querySelector('div')

    // simulate client re-loading
    durruti.server().render(One, $app)

    expect($container).to.equal($app.querySelector('div'))
  })
})
