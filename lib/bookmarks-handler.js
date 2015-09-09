var Promise = require('bluebird');
var express_router = require('express-promise-router');
var _ = require('lodash');

var oada_error = require('oada-error');


var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var  users_driver = config.libs.auth.datastores.users();
  var tokens_driver = config.libs.auth.datastores.tokens();
  var    res_driver = config.libs.db.resources();
  var        scopes = config.libs.scopes();
  var           log = config.libs.log().child({ module: 'bookmarks-handler' });
  var     oada_util = config.libs.util();

  var _BookmarksHandler = express_router();

  // Rewrite the /bookmarks URL to be /resources/<bookmarksid>,
  // using the bookmarksid defined for this token
  _BookmarksHandler.all(/^\/bookmarks/, function(req, res) {

    return Promise.try(function() {
      // Let the log know this request occurred:
      log.info(req.method + " " + req.url);

      // Figure out the username associated with the current token:
      var token = scopes.parseTokenFromRequest(req);
      return Promise.fromNode(function(cb) {
        tokens_driver.findByToken(token, cb);
      });

    }).then(function(token) {
      if (!_.has(token, 'user._id')) {
        throw new oada_error.OADAError('No valid user is associated with this token.  /bookmarks is therefore undefined.');
      }
      // Get the bookmarks resourceid for that user:
      return Promise.fromNode(function(cb) {
        users_driver.findByUsername(token.user._id, cb);
      });

    }).then(function(user) {
      if (!user || !oada_util.isLink(user.bookmarks)) {
        log.error('Request made with token that has no associated user, or a user with no bookmarks.  users_auth_driver.findByUsername returned info = ', user);
        throw new oada_error.OADAError('Bookmarks not found', oada_error.codes.NOT_FOUND, 'There is no known bookmarks resource for this user.');
      }

      // replace the /bookmarks URL with the bookmarksid we found:
      req.url = req.url.replace(/^\/bookmarks/, '/resources/'+user.bookmarks._id);
      //log.debug('bookmarks-handler.all: rewrote req.url to ' + req.url);
      //log.trace('bookmarks-handler.all: body = ', req.body);
      //log.trace('bookmarks-handler.all: req = ', req);
      return 'next'; // call the next matching router, which will eventually include /resources
    });

  });

  singleton = _BookmarksHandler;
  return singleton;
};
