var expect = require('chai').expect;

var driver = require('../lib/memory-db-code-driver.js');

describe('memory-db-code-driver', function() {

  it('should be able to set a code and then get it back', function() {
    var code = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(code, val);
    }).then(function() {
      return driver.get(code);
    }).then(function(result) {
      expect(result).to.deep.equal(val);
    });
  });

  it('should be able to set and then delete a code', function() {
    var code = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(code, val);
    }).then(function() {
      return driver.delete(code);
    }).then(function() {
      return driver.get(code);
    }).then(function(result) {
      expect(!result).to.equal(true);
    });
  });

});
