/* durruti tests
 */

describe('Core', function () {
  'use strict'

  it('should render a component', function () {
    function TestComponent () {
      this.render = function () {
        return '<div>Component</div>'
      }
    }

    expect(durruti.render(TestComponent)).to.equal('<div data-durruti-id="0">Component</div>')
  })

  it('should render nested components', function () {
    function Child () {
      this.render = function () {
        return '<div>Child</div>'
      }
    }

    function Parent () {
      this.render = function () {
        return '<div>Parent' + durruti.render(Child) + '</div>'
      }
    }

    expect(durruti.render(Parent)).to.contain('Child')
  })
})
