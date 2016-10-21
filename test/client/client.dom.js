/* dom patching
 */

describe('DOM', function () {
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

  it('should only update the text', function () {
    var count = 0

    function One () {
      this.render = function () {
        return '<div>' + count + '</div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')
    count++

    durruti.render(One, $container)

    expect($container).to.equal($app.querySelector('div'))
    expect($container.innerHTML).to.equal('1')
  })

  it('should only update the attribute value', function () {
    var count = 0

    function One () {
      this.render = function () {
        return '<div class="' + count + '"></div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')
    count++

    durruti.render(One, $container)

    expect($container).to.equal($app.querySelector('div'))
    expect($container.className).to.equal('1')
  })

  it('should replace the entire node', function () {
    var count = [ 'one' ]

    function One () {
      this.render = function () {
        return '<div>' +
           count.map(function (c) {
             return '<div>' + c + '</div>'
           }).join('') +
        '</div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')
    count.push('two')

    durruti.render(One, $container)

    expect($container).to.not.equal($app.querySelector('div'))
    expect($container.childNodes.length).to.equal(1)
  })

  it('should remove event listeners on patch', function () {
    var count = 0

    var clickEvent = document.createEvent('Event')
    clickEvent.initEvent('click', true, true)

    function One () {
      this.mount = function ($node) {
        $node.addEventListener('click', function () {
          count++
          durruti.render(One, $node)
        })
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')

    $container.dispatchEvent(clickEvent)
    $container.dispatchEvent(clickEvent)
    $container.dispatchEvent(clickEvent)

    expect(count).to.equal(3)
  })

  it('should remove event listeners on sub-components', function () {
    var count = 0

    var clickEvent = document.createEvent('Event')
    clickEvent.initEvent('click', true, true)

    function Two () {
      this.mount = function ($node) {
        $node.addEventListener('click', function () {
          count++

          durruti.render(One, $one)
        })
      }

      this.render = function () {
        return '<div class="two">two</div>'
      }
    }

    var $one

    function One () {
      this.mount = function ($node) {
        $one = $node
      }

      this.render = function () {
        return '<div data-count="' + count + '">' + durruti.render(Two) + '</div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('.two')

    $container.dispatchEvent(clickEvent)
    $container.dispatchEvent(clickEvent)
    $container.dispatchEvent(clickEvent)

    expect(count).to.equal(3)
  })
})
