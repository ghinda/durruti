/* shared state test
 */

describe('State', function () {
  'use strict'

  it('should share store state between server and client', function () {
    var data = {
      test: '123'
    }

    var simulatedSharedState = ';(function(){window["DURRUTI"] = JSON.parse(\'' + JSON.stringify(data) + '\')}());'

    var $script = document.createElement('script')
    $script.textContent = simulatedSharedState

    document.body.appendChild($script)

    var s = new durruti.Store('test')

    expect(s.get()).to.equal('123')
  })
})
