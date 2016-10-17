/* perf tests
 */

describe('Client Perf', function () {
  'use strict'

  // only test in chrome and firefox.
  if (window.navigator.userAgent.indexOf('Chrome/') === -1 && window.navigator.userAgent.indexOf('Firefox/') === -1) {
    return
  }

  var $fixtures = document.querySelector('.fixtures')

  var $app
  beforeEach(function () {
    if ($app) {
      $fixtures.removeChild($app)
    }

    $app = document.createElement('div')
    $fixtures.appendChild($app)
  })

  var renderTime = 50

  it('should render in under ' + renderTime, function () {
    this.slow(20)

    var count = 0

    function One () {
      this.render = function () {
        return '<div data-count="' + count + '">' + count + durruti.render(Two) + '</div>'
      }
    }

    function Two () {
      this.render = function () {
        return '<div data-count="' + count + '">' + count + durruti.render(Three) + '</div>'
      }
    }

    function Three () {
      this.render = function () {
        return '<div data-count="' + count + '">' + count + '</div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')

    var t0 = window.performance.now()

    for (count = 0; count < 101; count++) {
      durruti.render(One, $container)
    }

    var t1 = window.performance.now()

    var time = t1 - t0

    console.log(time)

    expect(time).to.be.below(renderTime)
  })
})
