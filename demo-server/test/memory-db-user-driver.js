var expect = require('chai').expect;

var driver = require('../lib/memory-db-user-driver.js');

describe('memory-db-user-driver', function() {

  it('should be able to set a user and then get it back', function() {
    var user = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(user, val);
    }).then(function() {
      return driver.get(user);
    }).then(function(result) {
      expect(result).to.deep.equal(val);
    });
  });

  it('should be able to set and then delete a user', function() {
    var user = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(user, val);
    }).then(function() {
      return driver.delete(user);
    }).then(function() {
      return driver.get(user);
    }).then(function(result) {
      expect(!result).to.equal(true);
    });
  });

});
