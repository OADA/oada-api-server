var expect = require('chai').expect;

var driver = require('../lib/memory-db-client-driver.js');

describe('memory-db-client-driver', function() {

  it('should be able to set a client and then get it back', function() {
    var client = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(client, val);
    }).then(function() {
      return driver.get(client);
    }).then(function(result) {
      expect(result).to.deep.equal(val);
    });
  });

  it('should be able to set and then delete a client', function() {
    var client = '123/~kw1';
    var val = { hello: 'world' };
    return driver.clean()
    .then(function() {
      return driver.set(client, val);
    }).then(function() {
      return driver.delete(client);
    }).then(function() {
      return driver.get(client);
    }).then(function(result) {
      expect(!result).to.equal(true);
    });
  });

});
