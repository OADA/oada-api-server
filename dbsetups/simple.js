// Creates one user with the config.auth token, creates it's bookmarks (empty),
// and creates one resource at id 123.
var Promise = require('bluebird');
var _ = require('lodash');

var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var res_driver = config.libs.db.resources();
  var tokens_driver = config.libs.db.tokens();
  var users_driver = config.libs.db.users();
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
    auth_user: {
      username: 'frank',
      password: 'test',
      resource: { _id: '1' }, // link to user resource
    },
    token: {
      token: config.test.auth.token,
      user: { _id: 'frank' }, // username of this user
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
        return users_driver.set(_Setup.user.username, _Setup.auth_user);

      // Create the token:
      }).then(function() {
        return tokens_driver.set(_Setup.token.token, _Setup.token);

      }).then(function() {
//        db.printContents();
      });
    },
  
  };

  singleton = _Setup;
  return singleton;
};
