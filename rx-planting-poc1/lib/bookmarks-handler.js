var log = require.main.require('./lib/logger.js').child({ module: 'bookmarks-handler' });
var db = require.main.require('./lib/memory-db.js');
var oada_util = require.main.require('./lib/oada-util.js');
var resources_handler = require.main.require('./lib/resources-handler.js');

var _BookmarksHandler = {

  rewriteRequest: function(req) {
    var token = oada_util.getAuthorizationTokenFromRequest(req);
    var bookmarksid = db.getBookmarksIdForToken(token);
    req.url = req.url.replace(/^\/bookmarks/, '/resources/'+bookmarksid);
    return req;
  },

  get: function(req,res) {
    log.info("GET", req.url);
    return resources_handler.get(_BookmarksHandler.rewriteRequest(req), res);
  },
  put: function(req,res) {
    log.info("PUT" + req.url);
    return resources_handler.put(_BookmarksHandler.rewriteRequest(req), res);
  },
  post: function(req,res) {
    log.info("POST " + req.url);
    return resources_handler.post(_BookmarksHandler.rewriteRequest(req), res);
  },
  delete: function(req,res) {
    log.info("DELETE" + req.url);
    return resources_handler.delete(_BookmarksHandler.rewriteRequest(req), res);
  },
};

module.exports = _BookmarksHandler;
