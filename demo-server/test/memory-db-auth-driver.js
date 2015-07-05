var expect = require('chai').expect;

var driver = require('../lib/memory-db-auth-driver.js');

describe('memory-db-auth-driver', function() {

  it('should be able to set a token and then get it back', function() {
    var token = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(token, val);
    }).then(function() {
      return driver.get(token);
    }).then(function(result) {
      expect(result).to.deep.equal(val);
    });
  });

  it('should be able to set and then delete a token', function() {
    var token = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(token, val);
    }).then(function() {
      return driver.delete(token);
    }).then(function() {
      return driver.get(token);
    }).then(function(result) {
      expect(!result).to.equal(true);
    });
  });

});
