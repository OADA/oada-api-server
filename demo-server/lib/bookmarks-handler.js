var express = require('express');

var           auth_db = require.main.require('./lib/memory-db.js');
var            res_db = require.main.require('./lib/memory-db.js');
var         oada_util = require.main.require('./lib/oada-util.js');
var               log = require.main.require('./lib/logger.js')
                        .child({ module: 'bookmarks-handler' });

var _BookmarksHandler = express.Router();

// Rewrite the /bookmarks URL to be /resources/<bookmarksid>,
// using the bookmarksid defined for this token
_BookmarksHandler.use(/^\/bookmarks(\/.*)?/, function(req, res, next) {

  // Let the log know this request occurred:
  log.info(req.method + " " + req.url);

  // Figure out the bookmarks resource based on the user associated with
  // the current token:
  var token = oada_util.getAuthorizationTokenFromRequest(req);
  var user_link = auth_db.getUserLinkForToken(token);
  if (!oada_util.isLink(user_link)) {
    log.error('Request made with token that has no associated user.');
    throw new Error("MAKE THIS USE OADA ERRORS");
  }

  // Return a promise for once the database call is finished:
  return db.get(user_link._id + "/bookmarks")
  .then(function(bookmarks_link) {
    if (!oada_util.isLink(bookmarks_link)) {
      log.error('Request made for user that has no valid bookmarks link');
      throw new Error("MAKE THIS USE OADA ERRORS TOO");
    }
    req.url = req.url.replace(/^\/bookmarks/, '/resources/'+bookmarks_link._id);
    next(); // call the next matching router, which will eventually include /resources
  });

},

module.exports = _BookmarksHandler;
