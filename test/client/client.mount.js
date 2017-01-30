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

  it('should unmount and mount one more time', function () {
    var mount = 0
    var unmount = 0

    function Two () {
      this.unmount = function () {
        unmount++
      }

      this.mount = function () {
        mount++
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

    var $container = $app.querySelector('div')

    durruti.render(One, $container)
    durruti.render(One, $container)

    expect(mount - 1).to.equal(unmount)
  })

  it('should unmount and mount one more time for each component', function () {
    var mount = 0
    var unmount = 0

    function Two () {
      this.unmount = function () {
        unmount++
      }

      this.mount = function () {
        mount++
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.render = function () {
        return '<div>' +
          Date.now() +
          durruti.render(Two) +
          durruti.render(Two) +
          durruti.render(Two) +
          durruti.render(Two) +
          '</div>'
      }
    }

    durruti.render(One, $app)

    var $container = $app.querySelector('div')

    durruti.render(One, $container)
    durruti.render(One, $container)

    // one extra mount for each component
    expect(mount - 4).to.equal(unmount)
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

  it('should mount new sub-components on durruti component node replace', function () {
    var mountOne = 0
    var mountTwo = 0

    function Two () {
      this.mount = function () {
        mountTwo++
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.mount = function ($container) {
        if (mountOne > 0) {
          return
        }

        mountOne++
        durruti.render(One, $container)
      }

      this.render = function () {
        return '<div>' + (mountOne > 0 ? durruti.render(Two) : '') + '</div>'
      }
    }

    durruti.render(One, $app)

    expect(mountTwo).to.equal(1)
  })

  it('should mount sub-components in replaced non-durruti nodes', function () {
    var mountOne = 0
    var mountTwo = 0

    function Two () {
      this.mount = function () {
        mountTwo++
      }

      this.render = function () {
        return '<div></div>'
      }
    }

    function One () {
      this.mount = function ($container) {
        if (mountOne > 0) {
          return
        }

        mountOne++
        durruti.render(One, $container)
      }

      this.render = function () {
        return '<div>' + (mountOne > 0 ? '<div>' + durruti.render(Two) + '</div>' : '<div></div>') + '</div>'
      }
    }

    durruti.render(One, $app)

    expect(mountTwo).to.equal(1)
  })
})
