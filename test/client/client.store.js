/* client store
 */

describe('Store', function () {
  'use strict'

  it('should keep store history', function () {
    var s = new durruti.Store()

    s.set('1')
    s.set('2')

    expect(s.list()).to.deep.equal([ '1', '2' ])
  })
})
