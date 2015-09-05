var expect = require('chai').expect;
var _ = require('lodash');
var Promise = require('bluebird');

var config = require('../../config.js')();
config.log_level = 'info';

// Library under test:
var setup = require('../../dbsetups/valleyix.js')(config);

// Setup other supporting libraries:
var res = config.libs.db.resources();
var user_driver = config.libs.db.users();
var outil = config.libs.util();
var db = config.libs.db.db(); // for db.clean()


describe('dbsetups/valleyix', function() {

  var user = null;
  var bookmarks = null;
  // Handy function to keep from having to lookup bookmarks._id everywhere
  var bmk = function(path) {
    path = (path.match(/^\//) ? path : '/'+path); // leading slash
    return '/'+bookmarks._id+path;
  };
  var descriptors = setup.populateDescriptors(setup.user()).bookmarks;

  before(function() {
    this.timeout(1000); // all these puts take awhile
    return Promise.try(function() {
      return db.clean();
    }).then(setup.setup)
    .then(function(link) {
      user = link;
      return res.get('/'+user._id)
      .then(function(info){
         bookmarks = info.val.bookmarks;
      });
    });
  });

  it('should have a user resource with a bookmarks link', function() {
    expect(user._id).to.be.defined;
  });

  describe('#paths', function() {
    var checkKeys = function(desc, path) {
      it('should have something at path /<bookmarkid>' + path, function() {
        return res.get(bmk(path)) // have to call bmk() inside it() because it needs before()
        .then(function(info) {
          expect(info.found).to.equal(true);
        });
      });

      if (desc && desc._meta) { 
        it('should have the proper media type ('+desc._meta._mediaType+') for path ' + path, function() {
          return res.get(bmk(path+'/_meta/_mediaType'))
          .then(function(info) {
            expect(info.found).to.equal(true);
            expect(info.val).to.equal(desc._meta._mediaType);
          });
        });
      }

      // Check all the keys here, follow links if there are any:
      _.each(desc, function(val, key) {
        if (typeof val !== 'object') return;
        var new_path = path + '/' + key;
        checkKeys(val, new_path);
      });

    };
    checkKeys(descriptors, '');
  });

  describe('#auth', function() {
    it('should have the auth_user with a password', function() {
      var auth_user = setup.auth_user();
      return user_driver.get(auth_user.username)
      .then(function(val) {
        expect(val.password).to.equal(auth_user.password);
        expect(val.resource._id).to.equal(setup.treeWithIds()._id); // the main user id matches the one in auth
      });
    });
  });
});

