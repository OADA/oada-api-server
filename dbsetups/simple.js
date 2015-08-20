// Creates one user with the config.auth token, creates it's bookmarks (empty),
// and creates one resource at id 123.
var Promise = require('bluebird');
var _ = require('lodash');

var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var res_driver = config.libs.db.resources();
  var auth_driver = config.libs.db.auth();
  var user_driver = config.libs.db.users();
  var db = config.libs.db.db(); // for printContents
  
  var _Setup = {
    resource: {
      _id: '3',
      a: 'the val at a',
    },
    meta: {
      _mediaType: 'application/vnd.oada.TEST.1+json',
      b: 'the val at b',
    },
    user: {
      _id: 1,
      bookmarks: {
        _id: '2',
        _rev: '0-0'
      },
      username: "frank",
      name: "Farmer Frank",
      family_name: "Frank",
      given_name: "Farmer",
      middle_name: "",
      nickname: "Frankie",
      email: "frank@openag.io"
    },
  
    setup: function() {
      // Create the resource:
      return res_driver.put('/'+_Setup.resource._id,
        _.cloneDeep(_Setup.resource),  // PUT will remove the _id without cloning: don't want that!
        { _meta: _Setup.meta }
      )
  
      // Create the bookmark:
      .then(function() {
        return res_driver.put('/'+_Setup.user.bookmarks._id, { }, { _meta: _Setup.meta });
  
      // Create the user:
      }).then(function() {
        return res_driver.put('/'+_Setup.user._id, _Setup.user,
            {_meta: _Setup.meta})
      }).then(function() {
        return user_driver.set(_Setup.user.username, { 
          resource: { _id: _Setup.user._id }, 
          password: "pass"
        });
      // Create the token:
      }).then(function() {
        return auth_driver.set(config.test.auth.token, {
          user: {_id: _Setup.user._id},
        });
      }).then(function() {
//        db.printContents();
      });
    },
  
  };

  singleton = _Setup;
  return singleton;
};
