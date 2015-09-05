var expect = require('chai').expect;

var config = require('../../config.js')();

var res_driver = config.libs.db.resources();
var tokens_driver = config.libs.db.tokens();
var users_driver = config.libs.db.users();

// Library under test:
var setup = require('../../dbsetups/simple.js')(config);

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
    return res_driver.get('/'+setup.user.bookmarks._id)
    .then(function(info) {
      expect(info.val._id).to.equal(setup.user.bookmarks._id);
    });
  });

  it('should have the user resource', function() {
    return res_driver.get('/'+setup.user._id)
    .then(function(info) {
      expect(info.val.bookmarks._id).to.equal(setup.user.bookmarks._id);
    });
  });

  it('should have the token', function() {
    return tokens_driver.get(setup.token.token)
    .then(function(val) {
      expect(val.user._id).to.equal(setup.token.user._id);
    });
  });

  it('should have the auth user with password', function() {
    return users_driver.get(setup.user.username)
    .then(function(val) {
      expect(val.password).to.equal(setup.auth_user.password);
    });
  });

});
