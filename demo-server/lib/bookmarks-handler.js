var Promise = require('bluebird');
var express_router = require('express-promise-router');

var auth_driver = require('./memory-db-auth-driver.js');
var  res_driver = require('./memory-db-resources-driver.js');
var      scopes = require('./scopes.js'); // for parseTokenFromRequest
var      config = require('../config.js');
var   oada_util = require('./oada-util.js');
var         log = require('./logger.js').child({ module: 'bookmarks-handler' });
var  oada_error = require('oada-error');

var _BookmarksHandler = express_router();

// Rewrite the /bookmarks URL to be /resources/<bookmarksid>,
// using the bookmarksid defined for this token
_BookmarksHandler.all(/^\/bookmarks/, function(req, res) {

  return Promise.try(function() {
    // Let the log know this request occurred:
    log.info(req.method + " " + req.url);

    // Figure out the the user associated with the current token:
    var token = scopes.parseTokenFromRequest(req);
    return auth_driver.get(token);
  }).then(function(token_info) {
    var userid = token_info.user._id;
    // Get the bookmarks resourceid for that user:
    return res_driver.get('/'+userid);

  }).then(function(info) {
    if (!info || !info.val || !oada_util.isLink(info.val.bookmarks)) {
      log.error('Request made with token that has no associated user.  auth_db returned info = ', info);
      throw new oada_error.OADAError('Bookmarks not found', oada_error.codes.NOT_FOUND, 'There is no known bookmarks resource for this user.');
    }

    // replace the /bookmarks URL with the bookmarksid we found:
    req.url = req.url.replace(/^\/bookmarks/, '/resources/'+info.val.bookmarks._id);
    return 'next'; // call the next matching router, which will eventually include /resources
  });

});

module.exports = _BookmarksHandler;
