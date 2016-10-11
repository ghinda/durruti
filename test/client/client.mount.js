/* mounting and unmounting
 */

describe('Mouting and Unmounting', function () {
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

  it('should mount rendered component', function () {
    var mounted = false

    function One () {
      this.mount = function () {
        mounted = true
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    durruti.render(One, $app)

    expect(mounted).to.equal(true)
  })

  it('should unmount existing component', function () {
    var unmounted = false

    function One () {
      this.unmount = function () {
        unmounted = true
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    // render first component
    durruti.render(One, $app)
    // re-render over exiting markup
    durruti.render(One, $app)

    expect(unmounted).to.equal(true)
  })

  it('should mount sub-component', function () {
    var mounted = false

    function Two () {
      this.mount = function () {
        mounted = true
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.render = function () {
        return '<div>' + durruti.render(Two) + '</div>'
      }
    }

    durruti.render(One, $app)

    expect(mounted).to.equal(true)
  })

  it('should unmount sub-component', function () {
    var unmounted = false

    function Two () {
      this.unmount = function () {
        unmounted = true
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.render = function () {
        return '<div>' + durruti.render(Two) + '</div>'
      }
    }

    durruti.render(One, $app)
    durruti.render(One, $app)

    expect(unmounted).to.equal(true)
  })

  it('should unmount multiple sub-components', function () {
    var unmounted = 0

    function Two () {
      this.unmount = function () {
        unmounted++
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.render = function () {
        return '<div>' + durruti.render(Two) + durruti.render(Two) + '</div>'
      }
    }

    durruti.render(One, $app)
    durruti.render(One, $app)

    expect(unmounted).to.equal(2)
  })
})
