var expect = require('chai').expect;
var res_driver = require('../../lib/memory-db-resources-driver.js');
var auth_driver = require('../../lib/memory-db-auth-driver.js');
var setup = require('../../dbsetups/simple.js');
var config = require('../../config.js');


describe('simple db setup', function() {
  before(function() {
    return setup.setup();
  });

  it('should have the resource', function() {
    return res_driver.get('/'+setup.resource._id)
    .then(function(info){
      expect(info.val.a).to.equal(setup.resource.a);
      expect(info.val._id).to.equal(setup.resource._id);
    });
  });

  it('should have the bookmarks resource', function() {
    return res_driver.get('/'+setup.bookmarksid)
    .then(function(info) {
      expect(info.val._id).to.equal(setup.bookmarksid);
    });
  });

  it('should have the user resource', function() {
    return res_driver.get('/'+setup.userid)
    .then(function(info) {
      expect(info.val.bookmarks._id).to.equal(setup.bookmarksid);
    });
  });

  it('should have the token', function() {
    return auth_driver.get(config.auth.token)
    .then(function(val) {
      expect(val.userid).to.equal(setup.userid);
    });
  });

});
