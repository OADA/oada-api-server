// Creates one user with the config.auth token, creates it's bookmarks (empty),
// and creates one resource at id 123.
var Promise = require('bluebird');
Promise.longStackTraces();
var res_driver = require('../lib/memory-db-resources-driver.js');
var auth_driver = require('../lib/memory-db-auth-driver.js');
var user_driver = require('../lib/memory-db-user-driver.js');
var db = require('../lib/memory-db.js'); // for printContents
var _ = require('lodash');

// Since config depends on us, and we depend on config (for auth.token), then
// we can't require config until runtime:
var _config = null;
var config = function() {
  if (!_config) _config = require('../config.js');
  return _config;
};

var _Setup = {
  userid: '1',
  bookmarksid: '2',
  resource: {
    _id: '3',
    a: 'the val at a',
  },
  meta: {
    _mediaType: 'application/vnd.oada.TEST.1+json',
    b: 'the val at b',
  },

  setup: function() {
    // Create the resource:
    return res_driver.put('/'+_Setup.resource._id,
      _.cloneDeep(_Setup.resource),  // PUT will remove the _id without cloning: don't want that!
      { _meta: _Setup.meta }
    )

    // Create the bookmark:
    .then(function() {
      return res_driver.put('/'+_Setup.bookmarksid, { }, { _meta: _Setup.meta });

    // Create the user:
    }).then(function() {
      return res_driver.put('/'+_Setup.userid,
        { bookmarks: { _id: _Setup.bookmarksid, _rev: '0-0' } },
        { _meta: _Setup.meta }
      );

    // Create the token:
    }).then(function() {
      return auth_driver.set(config().auth.token, {
        userid: _Setup.userid,
      });
    }).then(function() {
      return user_driver.set(config().user.username, config().user);
    }).then(function() {
//      db.printContents();
    });
  },

};

module.exports = _Setup;
