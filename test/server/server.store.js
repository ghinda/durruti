/* durruti tests
 */

describe('Store', function () {
  'use strict'

  it('should set data in a store', function () {
    var Store = require('../../store')
    var testStore = new Store()

    testStore.set('test')

    expect(testStore.get()).to.equal('test')
  })
})
