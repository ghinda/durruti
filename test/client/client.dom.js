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

  it('should uncheck checked checkbox', function (done) {
    var mounted = false

    var checked = 'checked'

    function One () {
      this.mount = function ($node) {
        if (mounted) {
          return
        }

        mounted = true

        // simulate user click.
        $node.querySelector('input').checked = true

        checked = ''
        durruti.render(One, $node)

        expect($app.querySelector('input').checked).to.equal(false)
        done()
      }

      this.render = function () {
        return '<div><input type="checkbox" ' + checked + '></div>'
      }
    }

    durruti.render(One, $app)
  })

  it('prevent cursor jump on re-render', function (done) {
    var value = 'default'
    var mounted = false

    function One () {
      this.mount = function ($node) {
        // simulate user click.
        var $input = $node.querySelector('input')

        if (!mounted) {
          mounted = true
          $input.focus()
          $input.setSelectionRange(0, 0)

          value = 'new value'
          durruti.render(One, $node)
        } else {
          expect($input.selectionStart).to.equal(0)
          done()
        }
      }

      this.render = function () {
        return '<div><input type="text" value="' + value + '"></div>'
      }
    }

    durruti.render(One, $app)
  })
})
